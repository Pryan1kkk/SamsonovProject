package ru.rental.service;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.rental.dto.Dto.*;
import ru.rental.model.*;
import ru.rental.repo.BookingRepository;
import ru.rental.repo.DisputeRepository;
import ru.rental.repo.ListingRepository;
import ru.rental.repo.UserRepository;
import ru.rental.web.ApiException;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
public class AdminService {
    private final UserRepository users;
    private final ListingRepository listings;
    private final DisputeRepository disputes;
    private final BookingRepository bookings;
    private final NotificationService notifications;
    @Transactional(readOnly = true)
    public StatsDto stats() {
        List<User> all = users.findAll();
        List<Booking> allBookings = bookings.findAll();
        BigDecimal turnover = allBookings.stream()
                .filter(b -> b.isPaid() && b.getStatus() != BookingStatus.CANCELLED)
                .map(Booking::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (BookingStatus st : BookingStatus.values()) {
            byStatus.put(st.json(), allBookings.stream().filter(b -> b.getStatus() == st).count());
        }
        List<TopListingDto> top = allBookings.stream()
                .collect(Collectors.groupingBy(b -> b.getListing().getTitle(), Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> new TopListingDto(e.getKey(), e.getValue()))
                .toList();
        return new StatsDto(
                all.size(),
                all.stream().filter(u -> u.getRole() == Role.CLIENT).count(),
                all.stream().filter(u -> u.getRole() == Role.PARTNER).count(),
                listings.findAll().stream().filter(l -> l.getStatus() == ListingStatus.ACTIVE).count(),
                allBookings.size(),
                allBookings.stream().filter(b -> b.getStatus() == BookingStatus.ACTIVE).count(),
                disputes.findByStatusOrderByIdDesc(DisputeStatus.OPEN).size(),
                turnover,
                byStatus,
                top);
    }
    @Transactional(readOnly = true)
    public List<UserDto> pendingPartners() {
        return users.findByRoleAndVerifiedFalse(Role.PARTNER).stream().map(UserDto::from).toList();
    }
    @Transactional
    public UserDto verifyPartner(Long id) {
        User u = users.findById(id).orElseThrow(() -> ApiException.notFound("Пользователь не найден"));
        if (u.getRole() != Role.PARTNER) {
            throw ApiException.badRequest("Пользователь не является партнёром");
        }
        u.setVerified(true);
        listings.findByPartnerIdAndStatus(u.getId(), ListingStatus.PENDING)
                .forEach(l -> l.setStatus(ListingStatus.ACTIVE));
        notifications.send(u, "Ваш аккаунт партнёра подтверждён, объявления опубликованы", "#/partner/listings");
        return UserDto.from(u);
    }
    @Transactional(readOnly = true)
    public List<ListingDto> listings(ListingStatus status) {
        return listings.findAll(Sort.by(Sort.Direction.DESC, "id")).stream()
                .filter(l -> status == null || l.getStatus() == status)
                .map(l -> ListingDto.from(l, null))
                .toList();
    }
    @Transactional
    public ListingDto moderateListing(Long id, ListingStatus status) {
        Listing l = listings.findById(id).orElseThrow(() -> ApiException.notFound("Объявление не найдено"));
        ListingStatus target = status == ListingStatus.HIDDEN ? ListingStatus.BLOCKED : status;
        if (l.getStatus() == target) {
            throw ApiException.conflict("Объявление уже в этом статусе");
        }
        l.setStatus(target);
        String text = switch (target) {
            case ACTIVE -> "Администрация опубликовала объявление «" + l.getTitle() + "»";
            case PENDING -> "Администрация вернула объявление «" + l.getTitle() + "» на проверку";
            default -> "Администрация скрыла объявление «" + l.getTitle() + "». Вернуть его самостоятельно нельзя";
        };
        notifications.send(l.getPartner(), text, "#/partner/listings");
        return ListingDto.from(l, null);
    }
    @Transactional(readOnly = true)
    public List<DisputeDto> disputes(DisputeStatus status) {
        List<Dispute> list = status == null ? disputes.findAllByOrderByIdDesc()
                : disputes.findByStatusOrderByIdDesc(status);
        return list.stream().map(DisputeDto::from).toList();
    }
    @Transactional
    public DisputeDto resolve(Long id, String resolution) {
        Dispute d = disputes.findById(id).orElseThrow(() -> ApiException.notFound("Спор не найден"));
        if (d.getStatus() == DisputeStatus.RESOLVED) {
            throw ApiException.conflict("Спор уже разобран");
        }
        d.setStatus(DisputeStatus.RESOLVED);
        d.setResolution(resolution);
        Booking b = d.getBooking();
        b.setStatus(BookingStatus.COMPLETED);
        String text = "Спор по бронированию №" + b.getId() + " разобран: " + resolution;
        notifications.send(b.getClient(), text, "#/my-bookings?b=" + b.getId());
        notifications.send(b.getListing().getPartner(), text, "#/partner/bookings?b=" + b.getId());
        return DisputeDto.from(d);
    }
}
