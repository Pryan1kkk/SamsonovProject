package ru.rental.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "auth_tokens")
@Getter
@Setter
@NoArgsConstructor
public class AuthToken {
    @Id
    @Column(length = 100)
    private String token;

    @ManyToOne(optional = false)
    private User user;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
