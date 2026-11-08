package ru.rental.dto;
import jakarta.validation.constraints.*;
import ru.rental.model.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
public final class Dto {
    private Dto() {
    }
    public record RegisterRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 120) String email,
            @Size(max = 30) String phone,
            @NotBlank @Size(min = 6, max = 100, message = "Пароль должен быть от 6 символов") String password,
            @NotNull Role role) {
    }
    public record LoginRequest(@NotBlank @Size(max = 120) String email, @NotBlank @Size(max = 200) String password) {
    }
    public record AuthResponse(String token, UserDto user) {
    }
    public record UpdateProfileRequest(
            @Size(max = 100) String name,
            @Size(max = 30) String phone,
            @Size(min = 6, max = 100, message = "Пароль должен быть от 6 символов") String password) {
    }
    public record UserDto(Long id, String name, String email, String phone, Role role,
                          Double rating, boolean verified, Instant createdAt) {
        public static UserDto from(User u) {
            return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getPhone(), u.getRole(),
                    u.getRating(), u.isVerified(), u.getCreatedAt());
        }
    }
    public record NameRequest(@NotBlank @Size(max = 60) String name) {
    }
    public record NamedDto(Long id, String name) {
    }
    public record ListingRequest(
            @NotNull Long categoryId,
            @NotNull Long cityId,
            @NotBlank @Size(max = 120) String title,
            @Size(max = 2000) String description,
            @NotNull @Positive @DecimalMax("1000000") BigDecimal pricePerDay,
            @Size(max = 10) List<String> photos) {
    }
    public record ListingPatch(
            Long categoryId,
            Long cityId,
            @Size(max = 120) String title,
            @Size(max = 2000) String description,
            @Positive @DecimalMax("1000000") BigDecimal pricePerDay,
            @Size(max = 10) List<String> photos) {
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
    public record ReturnRequest(boolean damaged, @Size(max = 1000) String description) {
    }
    public record ReviewRequest(
            @NotNull Long bookingId,
            @NotNull TargetType targetType,
            @NotNull @Min(1) @Max(5) Integer rating,
            @Size(max = 1000) String comment) {
    }
    public record ReviewDto(Long id, Long bookingId, Long authorId, TargetType targetType,
                            Long targetUserId, String authorName, int rating, String comment, Instant createdAt) {
        public static ReviewDto from(Review r) {
            return new ReviewDto(r.getId(), r.getBooking().getId(), r.getAuthor().getId(),
                    r.getTargetType(), r.getTargetUser() == null ? null : r.getTargetUser().getId(),
                    r.getAuthor().getName(), r.getRating(), r.getCommentText(), r.getCreatedAt());
        }
    }
    public record NotificationDto(Long id, String message, String link, boolean read, Instant createdAt) {
        public static NotificationDto from(Notification n) {
            return new NotificationDto(n.getId(), n.getMessage(), n.getLink(), n.isRead(), n.getCreatedAt());
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
    public record StatsDto(long users, long clients, long partners, long activeListings, long bookings,
                           long activeBookings, long openDisputes, BigDecimal turnover,
                           Map<String, Long> byStatus, List<TopListingDto> topListings) {
    }
    public record TopListingDto(String title, long bookings) {
    }
    public record PartnerStatsDto(long listings, long newRequests, long activeRentals, long completed,
                                  BigDecimal earned, Double rating) {
    }
    public record ResolveRequest(@NotBlank @Size(max = 1000) String resolution) {
    }
}
