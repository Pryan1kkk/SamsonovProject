package ru.rental.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Listing {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private User partner;

    @ManyToOne(optional = false)
    private Category category;

    @ManyToOne(optional = false)
    private City city;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerDay;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ListingStatus status;

    /** Ссылки на фотографии. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "listing_photos", joinColumns = @JoinColumn(name = "listing_id"))
    @Column(name = "url", length = 1000)
    private List<String> photos = new ArrayList<>();
}
