package ru.rental.repo;
import org.springframework.data.jpa.repository.JpaRepository;
import ru.rental.model.Dispute;
import ru.rental.model.DisputeStatus;
import java.util.List;
public interface DisputeRepository extends JpaRepository<Dispute, Long> {
    List<Dispute> findAllByOrderByIdDesc();
    List<Dispute> findByStatusOrderByIdDesc(DisputeStatus status);
}
