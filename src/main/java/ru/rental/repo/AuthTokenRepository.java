package ru.rental.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.rental.model.AuthToken;

public interface AuthTokenRepository extends JpaRepository<AuthToken, String> {
}
