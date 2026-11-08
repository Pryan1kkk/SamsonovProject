package ru.rental.service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.rental.dto.Dto.*;
import ru.rental.model.*;
import ru.rental.repo.BookingRepository;
import ru.rental.repo.ListingRepository;
import ru.rental.repo.ReviewRepository;
import ru.rental.repo.UserRepository;
import ru.rental.web.ApiException;
import java.util.List;
@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviews;
    private final BookingRepository bookings;
    private final ListingRepository listings;
    private final UserRepository users;
    private final NotificationService notifications;
    @Transactional
    public ReviewDto create(User me, ReviewRequest r) {
        Booking b = bookings.findById(r.bookingId())
                .orElseThrow(() -> ApiException.notFound("Бронирование не найдено"));
        if (b.getStatus() != BookingStatus.COMPLETED) {
            throw ApiException.badRequest("Отзыв можно оставить только после завершения аренды");
        }
        boolean isClient = b.getClient().getId().equals(me.getId());
        boolean isPartner = b.getListing().getPartner().getId().equals(me.getId());
        if (!isClient && !isPartner) {
            throw ApiException.forbidden("Вы не участник этого бронирования");
        }
        TargetType type = r.targetType();
        if (isClient && type == TargetType.CLIENT) {
            throw ApiException.badRequest("Клиент может оценить только объявление (listing) или партнёра (partner)");
        }
        if (isPartner && type != TargetType.CLIENT) {
            throw ApiException.badRequest("Партнёр может оценить только клиента (client)");
        }
        if (reviews.existsByBookingIdAndAuthorIdAndTargetType(b.getId(), me.getId(), type)) {
            throw ApiException.conflict("Вы уже оставили такой отзыв по этому бронированию");
        }
        User target = switch (type) {
            case PARTNER -> b.getListing().getPartner();
            case CLIENT -> b.getClient();
            case LISTING -> null;
        };
        Review review = new Review();
        review.setBooking(b);
        review.setAuthor(me);
        review.setTargetType(type);
        review.setTargetUser(target);
        review.setRating(r.rating());
        review.setCommentText(r.comment());
        reviews.save(review);
        if (target != null) {
            Double avg = reviews.avgForUser(target.getId());
            target.setRating(avg == null ? null : Math.round(avg * 100) / 100.0);
            notifications.send(target, "Вам оставили отзыв (" + r.rating() + "/5) по бронированию №" + b.getId(), "#/profile");
        }
        return ReviewDto.from(review);
    }
    @Transactional(readOnly = true)
    public java.util.Map<Long, List<String>> mine(User me) {
        return reviews.findByAuthorId(me.getId()).stream().collect(java.util.stream.Collectors.groupingBy(
                r -> r.getBooking().getId(),
                java.util.stream.Collectors.mapping(r -> r.getTargetType().json(), java.util.stream.Collectors.toList())));
    }
    @Transactional(readOnly = true)
    public List<ReviewDto> forListing(Long listingId) {
        if (!listings.existsById(listingId)) {
            throw ApiException.notFound("Объявление не найдено");
        }
        return reviews.findForListing(TargetType.LISTING, listingId).stream().map(ReviewDto::from).toList();
    }
    @Transactional(readOnly = true)
    public List<ReviewDto> forUser(Long userId) {
        if (!users.existsById(userId)) {
            throw ApiException.notFound("Пользователь не найден");
        }
        return reviews.findByTargetUserIdOrderByIdDesc(userId).stream().map(ReviewDto::from).toList();
    }
}
