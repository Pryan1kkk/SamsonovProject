package ru.rental.repo;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.rental.model.Listing;
import ru.rental.model.ListingStatus;
import java.util.List;
import java.util.Optional;
public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {
    @Override
    @EntityGraph(attributePaths = {"partner", "category", "city"})
    List<Listing> findAll(Specification<Listing> spec, Sort sort);
    List<Listing> findByPartnerIdOrderByIdDesc(Long partnerId);
    List<Listing> findByPartnerIdAndStatus(Long partnerId, ListingStatus status);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select l from Listing l where l.id = :id")
    Optional<Listing> lockById(@Param("id") Long id);
}
