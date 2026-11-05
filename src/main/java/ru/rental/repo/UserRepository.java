package ru.rental.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.rental.model.Role;
import ru.rental.model.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findByRole(Role role);

    List<User> findByRoleAndVerifiedFalse(Role role);
}
