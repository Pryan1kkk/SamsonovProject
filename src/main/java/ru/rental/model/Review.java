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
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Booking booking;

    @ManyToOne(optional = false)
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TargetType targetType;

    @ManyToOne
    private User targetUser;

    @Column(nullable = false)
    private int rating;

    @Column(name = "comment_text", length = 2000)
    private String commentText;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
