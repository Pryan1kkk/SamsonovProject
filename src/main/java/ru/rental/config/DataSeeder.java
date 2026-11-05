package ru.rental.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import ru.rental.model.*;
import ru.rental.repo.*;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository users;
    private final CategoryRepository categories;
    private final CityRepository cities;
    private final ListingRepository listings;
    private final PasswordEncoder encoder;

    @Override
    public void run(String... args) {
        if (users.count() > 0) {
            return;
        }

        createUser("Администратор", "admin@admin.admin", "admin123", Role.ADMIN, true);
        User partner = createUser("Прокат «Туристъ»", "partner@partner.partner", "partner123", Role.PARTNER, true);

        List<Category> cats = List.of("Палатки", "Велосипеды", "Лыжи", "Сноуборды", "Сплавы", "Альпинизм").stream()
                .map(this::category).toList();
        List<City> cts = List.of("Тверь", "Москва", "Санкт-Петербург").stream().map(this::city).toList();

        createListing(partner, cats.get(0), cts.get(0), "Палатка 3-местная Alexika", "Лёгкая трёхместная палатка для походов",
                "450.00");
        createListing(partner, cats.get(1), cts.get(0), "Горный велосипед Stels 27.5", "Алюминиевая рама, 21 скорость",
                "700.00");
        createListing(partner, cats.get(2), cts.get(1), "Беговые лыжи с ботинками", "Комплект: лыжи, палки, ботинки",
                "500.00");
        createListing(partner, cats.get(4), cts.get(2), "Байдарка двухместная", "Для сплава по рекам, весла в комплекте",
                "1200.00");

        log.info("Созданы демо-данные. Вход: admin@admin.admin / admin123, "
                + "partner@partner.partner / partner123");
    }

    private User createUser(String name, String email, String password, Role role, boolean verified) {
        User u = new User();
        u.setName(name);
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(password));
        u.setRole(role);
        u.setVerified(verified);
        return users.save(u);
    }

    private Category category(String name) {
        Category c = new Category();
        c.setName(name);
        return categories.save(c);
    }

    private City city(String name) {
        City c = new City();
        c.setName(name);
        return cities.save(c);
    }

    private void createListing(User partner, Category category, City city, String title, String description,
                               String price) {
        Listing l = new Listing();
        l.setPartner(partner);
        l.setCategory(category);
        l.setCity(city);
        l.setTitle(title);
        l.setDescription(description);
        l.setPricePerDay(new BigDecimal(price));
        l.setStatus(ListingStatus.ACTIVE);
        listings.save(l);
    }
}
