package ru.rental.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.rental.model.Notification;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByIdDesc(Long userId);
}
