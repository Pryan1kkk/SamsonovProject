package ru.rental.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookings;
    private final ListingRepository listings;
    private final UserRepository users;
    private final DisputeRepository disputes;
    private final NotificationService notifications;

    @Value("${app.deposit-percent:30}")
    private int depositPercent;

    // ================= Клиент =================

    @Transactional
    public BookingDto create(User me, BookingRequest r) {
        LocalDate from = r.dateFrom();
        LocalDate to = r.dateTo();
        if (to.isBefore(from)) {
            throw ApiException.badRequest("Дата окончания не может быть раньше даты начала");
        }
        if (from.isBefore(LocalDate.now())) {
            throw ApiException.badRequest("Нельзя бронировать на прошедшие даты");
        }
        Listing listing = listings.findById(r.listingId())
                .orElseThrow(() -> ApiException.notFound("Объявление не найдено"));
        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw ApiException.badRequest("Это объявление сейчас недоступно для бронирования");
        }
        if (bookings.countOverlapping(listing.getId(), BookingStatus.BLOCKING, from, to, 0L) > 0) {
            throw ApiException.conflict("На эти даты снаряжение уже занято");
        }

        long days = ChronoUnit.DAYS.between(from, to) + 1; // даты включительно
        BigDecimal total = listing.getPricePerDay().multiply(BigDecimal.valueOf(days));
        BigDecimal deposit = total.multiply(BigDecimal.valueOf(depositPercent))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        Booking b = new Booking();
        b.setListing(listing);
        b.setClient(me);
        b.setDateFrom(from);
        b.setDateTo(to);
        b.setStatus(BookingStatus.PENDING);
        b.setTotalPrice(total);
        b.setDeposit(deposit);
        bookings.save(b);

        notifications.send(listing.getPartner(), "Новая заявка №" + b.getId() + " на «" + listing.getTitle()
                + "» с " + from + " по " + to);
        return BookingDto.from(b);
    }

    @Transactional(readOnly = true)
    public List<BookingDto> ofClient(User me) {
        return bookings.findByClientIdOrderByIdDesc(me.getId()).stream().map(BookingDto::from).toList();
    }

    @Transactional(readOnly = true)
    public BookingDto get(User me, Long id) {
        Booking b = find(id);
        boolean allowed = me.getRole() == Role.ADMIN
                || b.getClient().getId().equals(me.getId())
                || b.getListing().getPartner().getId().equals(me.getId());
        if (!allowed) {
            throw ApiException.forbidden("Нет доступа к этому бронированию");
        }
        return BookingDto.from(b);
    }

    @Transactional
    public BookingDto cancel(User me, Long id) {
        Booking b = find(id);
        requireClient(b, me);
        if (b.getStatus() != BookingStatus.PENDING && b.getStatus() != BookingStatus.CONFIRMED) {
            throw ApiException.badRequest("Отменить можно только заявку в статусе pending или confirmed");
        }
        b.setStatus(BookingStatus.CANCELLED);
        b.setPaid(false); // если было оплачено — считаем, что деньги возвращены
        notifications.send(b.getListing().getPartner(), "Клиент отменил бронирование №" + b.getId());
        return BookingDto.from(b);
    }

    @Transactional
    public BookingDto pay(User me, Long id) {
        Booking b = find(id);
        requireClient(b, me);
        if (b.getStatus() != BookingStatus.CONFIRMED) {
            throw ApiException.badRequest("Оплатить можно после подтверждения заявки партнёром");
        }
        if (b.isPaid()) {
            throw ApiException.conflict("Бронирование уже оплачено");
        }
        b.setPaid(true);
        notifications.send(b.getListing().getPartner(), "Бронирование №" + b.getId() + " оплачено клиентом");
        return BookingDto.from(b);
    }

    @Transactional(readOnly = true)
    public List<BookingDto> ofPartner(User me, BookingStatus status) {
        return bookings.findByListingPartnerIdOrderByIdDesc(me.getId()).stream()
                .filter(b -> status == null || b.getStatus() == status)
                .map(BookingDto::from)
                .toList();
    }

    @Transactional
    public BookingDto confirm(User me, Long id) {
        Booking b = find(id);
        requirePartner(b, me);
        requireStatus(b, BookingStatus.PENDING);
        // На момент подтверждения даты могли занять другой заявкой
        if (bookings.countOverlapping(b.getListing().getId(), BookingStatus.BLOCKING,
                b.getDateFrom(), b.getDateTo(), b.getId()) > 0) {
            throw ApiException.conflict("На эти даты уже есть подтверждённое бронирование");
        }
        b.setStatus(BookingStatus.CONFIRMED);
        notifications.send(b.getClient(), "Заявка №" + b.getId() + " подтверждена. Оплатите бронирование.");
        return BookingDto.from(b);
    }

    @Transactional
    public BookingDto reject(User me, Long id) {
        Booking b = find(id);
        requirePartner(b, me);
        requireStatus(b, BookingStatus.PENDING);
        b.setStatus(BookingStatus.CANCELLED);
        notifications.send(b.getClient(), "Заявка №" + b.getId() + " отклонена партнёром");
        return BookingDto.from(b);
    }

    @Transactional
    public BookingDto issue(User me, Long id) {
        Booking b = find(id);
        requirePartner(b, me);
        requireStatus(b, BookingStatus.CONFIRMED);
        if (!b.isPaid()) {
            throw ApiException.badRequest("Нельзя выдать снаряжение: бронирование не оплачено");
        }
        b.setStatus(BookingStatus.ACTIVE);
        notifications.send(b.getClient(), "Снаряжение по бронированию №" + b.getId() + " выдано. Не забудьте вернуть до "
                + b.getDateTo());
        return BookingDto.from(b);
    }

    @Transactional
    public BookingDto returned(User me, Long id, ReturnRequest r) {
        Booking b = find(id);
        requirePartner(b, me);
        requireStatus(b, BookingStatus.ACTIVE);

        if (r != null && r.damaged()) {
            b.setStatus(BookingStatus.DISPUTED);
            Dispute d = new Dispute();
            d.setBooking(b);
            d.setDescription(r.description() == null || r.description().isBlank()
                    ? "Партнёр сообщил о повреждении или утере снаряжения" : r.description());
            d.setStatus(DisputeStatus.OPEN);
            disputes.save(d);
            users.findByRole(Role.ADMIN).forEach(a ->
                    notifications.send(a, "Новый спор по бронированию №" + b.getId()));
            notifications.send(b.getClient(), "По бронированию №" + b.getId() + " открыт спор: " + d.getDescription());
        } else {
            b.setStatus(BookingStatus.COMPLETED);
            notifications.send(b.getClient(), "Бронирование №" + b.getId() + " завершено. Оставьте отзыв!");
        }
        return BookingDto.from(b);
    }

    private Booking find(Long id) {
        return bookings.findById(id).orElseThrow(() -> ApiException.notFound("Бронирование не найдено"));
    }

    private void requireClient(Booking b, User me) {
        if (!b.getClient().getId().equals(me.getId())) {
            throw ApiException.forbidden("Это не ваше бронирование");
        }
    }

    private void requirePartner(Booking b, User me) {
        if (!b.getListing().getPartner().getId().equals(me.getId())) {
            throw ApiException.forbidden("Это бронирование не по вашему объявлению");
        }
    }

    private void requireStatus(Booking b, BookingStatus expected) {
        if (b.getStatus() != expected) {
            throw ApiException.badRequest("Действие недоступно: статус бронирования — "
                    + b.getStatus().json() + ", нужен " + expected.json());
        }
    }
}
