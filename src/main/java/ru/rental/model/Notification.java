package ru.rental.model;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;
@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "notification", indexes = @Index(name = "idx_notification_user", columnList = "user_id"))
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    private User user;
    @Column(nullable = false, length = 500)
    private String message;
    @Column(length = 120)
    private String link;
    @Column(name = "is_read", nullable = false)
    private boolean read;
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
