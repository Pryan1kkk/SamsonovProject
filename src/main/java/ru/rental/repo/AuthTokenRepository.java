package ru.rental.repo;
import org.springframework.data.jpa.repository.JpaRepository;
import ru.rental.model.AuthToken;
import java.time.Instant;
public interface AuthTokenRepository extends JpaRepository<AuthToken, String> {
    void deleteByCreatedAtBefore(Instant moment);
}
