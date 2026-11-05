package ru.rental.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import ru.rental.model.Listing;
import ru.rental.model.ListingStatus;

import java.util.List;

public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {
    List<Listing> findByPartnerIdOrderByIdDesc(Long partnerId);

    List<Listing> findByPartnerIdAndStatus(Long partnerId, ListingStatus status);
}
