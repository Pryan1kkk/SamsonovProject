package ru.rental.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.rental.dto.Dto.*;
import ru.rental.model.*;
import ru.rental.repo.DisputeRepository;
import ru.rental.repo.ListingRepository;
import ru.rental.repo.UserRepository;
import ru.rental.web.ApiException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository users;
    private final ListingRepository listings;
    private final DisputeRepository disputes;
    private final NotificationService notifications;

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
        notifications.send(u, "Ваш аккаунт партнёра подтверждён, объявления опубликованы");
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
        l.setStatus(status);
        notifications.send(l.getPartner(), "Статус объявления «" + l.getTitle() + "» изменён: " + status.json());
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
        notifications.send(b.getClient(), text);
        notifications.send(b.getListing().getPartner(), text);
        return DisputeDto.from(d);
    }
}
