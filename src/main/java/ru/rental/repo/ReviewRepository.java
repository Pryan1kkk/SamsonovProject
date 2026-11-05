package ru.rental.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.rental.model.Review;
import ru.rental.model.TargetType;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByBookingIdAndAuthorIdAndTargetType(Long bookingId, Long authorId, TargetType targetType);

    List<Review> findByTargetUserIdOrderByIdDesc(Long userId);

    @Query("select r from Review r where r.targetType = :type and r.booking.listing.id = :listingId order by r.id desc")
    List<Review> findForListing(@Param("type") TargetType type, @Param("listingId") Long listingId);

    @Query("select avg(r.rating) from Review r where r.targetUser.id = :userId")
    Double avgForUser(@Param("userId") Long userId);

    @Query("select avg(r.rating) from Review r where r.targetType = :type and r.booking.listing.id = :listingId")
    Double avgForListing(@Param("type") TargetType type, @Param("listingId") Long listingId);
}
