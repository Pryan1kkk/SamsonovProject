package ru.rental.dto;

import jakarta.validation.constraints.*;
import ru.rental.model.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class Dto {
    private Dto() {
    }

    public record RegisterRequest(
            @NotBlank String name,
            @NotBlank @Email String email,
            String phone,
            @NotBlank @Size(min = 6, message = "Пароль должен быть не короче 6 символов") String password,
            @NotNull Role role) {
    }

    public record LoginRequest(@NotBlank String email, @NotBlank String password) {
    }

    public record AuthResponse(String token, UserDto user) {
    }

    public record UpdateProfileRequest(
            String name,
            String phone,
            @Size(min = 6, message = "Пароль должен быть не короче 6 символов") String password) {
    }

    public record UserDto(Long id, String name, String email, String phone, Role role,
                          Double rating, boolean verified, Instant createdAt) {
        public static UserDto from(User u) {
            return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getPhone(), u.getRole(),
                    u.getRating(), u.isVerified(), u.getCreatedAt());
        }
    }

    public record NameRequest(@NotBlank String name) {
    }

    public record NamedDto(Long id, String name) {
    }

    public record ListingRequest(
            @NotNull Long categoryId,
            @NotNull Long cityId,
            @NotBlank String title,
            String description,
            @NotNull @Positive BigDecimal pricePerDay,
            List<String> photos) {
    }

    public record ListingPatch(
            Long categoryId,
            Long cityId,
            String title,
            String description,
            @Positive BigDecimal pricePerDay,
            List<String> photos) {
    }

    public record ListingDto(Long id, Long partnerId, String partnerName, Long categoryId, Long cityId, String title,
                             String description, BigDecimal pricePerDay, ListingStatus status,
                             List<String> photos, Double rating) {
        public static ListingDto from(Listing l, Double rating) {
            return new ListingDto(l.getId(), l.getPartner().getId(), l.getPartner().getName(), l.getCategory().getId(),
                    l.getCity().getId(), l.getTitle(), l.getDescription(), l.getPricePerDay(),
                    l.getStatus(), List.copyOf(l.getPhotos()), rating);
        }
    }

    public record BusyPeriod(LocalDate dateFrom, LocalDate dateTo, BookingStatus status) {
    }

    public record BookingRequest(
            @NotNull Long listingId,
            @NotNull LocalDate dateFrom,
            @NotNull LocalDate dateTo) {
    }

    public record BookingDto(Long id, Long listingId, String listingTitle, Long clientId, String clientName,
                             LocalDate dateFrom, LocalDate dateTo,
                             BookingStatus status, BigDecimal totalPrice, BigDecimal deposit, boolean paid) {
        public static BookingDto from(Booking b) {
            return new BookingDto(b.getId(), b.getListing().getId(), b.getListing().getTitle(),
                    b.getClient().getId(), b.getClient().getName(),
                    b.getDateFrom(), b.getDateTo(), b.getStatus(), b.getTotalPrice(), b.getDeposit(),
                    b.isPaid());
        }
    }

    public record ReturnRequest(boolean damaged, String description) {
    }

    public record ReviewRequest(
            @NotNull Long bookingId,
            @NotNull TargetType targetType,
            @NotNull @Min(1) @Max(5) Integer rating,
            String comment) {
    }

    public record ReviewDto(Long id, Long bookingId, Long authorId, TargetType targetType,
                            Long targetUserId, int rating, String comment, Instant createdAt) {
        public static ReviewDto from(Review r) {
            return new ReviewDto(r.getId(), r.getBooking().getId(), r.getAuthor().getId(),
                    r.getTargetType(), r.getTargetUser() == null ? null : r.getTargetUser().getId(),
                    r.getRating(), r.getCommentText(), r.getCreatedAt());
        }
    }

    public record NotificationDto(Long id, String message, boolean read, Instant createdAt) {
        public static NotificationDto from(Notification n) {
            return new NotificationDto(n.getId(), n.getMessage(), n.isRead(), n.getCreatedAt());
        }
    }

    public record ModerateRequest(@NotNull ListingStatus status) {
    }

    public record DisputeDto(Long id, Long bookingId, String description, DisputeStatus status,
                             String resolution) {
        public static DisputeDto from(Dispute d) {
            return new DisputeDto(d.getId(), d.getBooking().getId(), d.getDescription(), d.getStatus(),
                    d.getResolution());
        }
    }

    public record ResolveRequest(@NotBlank String resolution) {
    }
}
