package ru.rental.repo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.rental.model.Booking;
import ru.rental.model.BookingStatus;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByClientIdOrderByIdDesc(Long clientId);
    List<Booking> findByListingPartnerIdOrderByIdDesc(Long partnerId);
    List<Booking> findByListingIdAndStatusInAndDateToGreaterThanEqualOrderByDateFromAsc(
            Long listingId, Collection<BookingStatus> statuses, LocalDate today);
    @Query("select count(b) from Booking b "
            + "where b.listing.id = :listingId and b.status in :statuses "
            + "and b.dateFrom <= :dTo and b.dateTo >= :dFrom and b.id <> :excludeId")
    long countOverlapping(@Param("listingId") Long listingId,
                          @Param("statuses") Collection<BookingStatus> statuses,
                          @Param("dFrom") LocalDate dFrom,
                          @Param("dTo") LocalDate dTo,
                          @Param("excludeId") Long excludeId);
}
