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
        List<Category> cats = List.of("Палатки", "Велосипеды", "Лыжи", "Сноуборды", "Сплавы", "Альпинизм", "Рюкзаки и спальники").stream()
                .map(this::category).toList();
        List<City> cts = List.of("Тверь", "Москва", "Санкт-Петербург").stream().map(this::city).toList();
        Object[][] items = {
                {0, 0, "Палатка 3-местная Alexika", "Лёгкая трёхместная палатка для походов, тамбур и два входа", "450.00", "tent-green"},
                {0, 1, "Палатка 2-местная MSR Hubba", "Компактная двухслойная палатка весом 1,7 кг", "380.00", "tent-blue"},
                {0, 0, "Палатка-шатёр 6-местная", "Просторный шатёр для семейного кемпинга со стойкой по центру", "900.00", "tent-big"},
                {1, 0, "Горный велосипед Stels 27.5", "Алюминиевая рама, 21 скорость, дисковые тормоза", "700.00", "bike-mtb"},
                {1, 1, "Шоссейный велосипед Merida", "Лёгкий карбоновый руль и 24 скорости для асфальта", "850.00", "bike-road"},
                {1, 2, "Городской велосипед с корзиной", "Удобная посадка, багажник и корзина, подходит для прогулок", "400.00", "bike-city"},
                {2, 1, "Беговые лыжи с ботинками", "Комплект: лыжи, палки, ботинки, подбираются по росту", "500.00", "ski-xc"},
                {2, 1, "Горные лыжи Atomic", "Универсальные лыжи для трасс средней сложности, крепления в комплекте", "900.00", "ski-alpine"},
                {3, 1, "Сноуборд Burton 155", "Твин-типа доска для парка и трассы, крепления Burton", "1100.00", "board-adult"},
                {3, 0, "Детский сноуборд Nitro 130", "Мягкая доска для начинающих, рост ребёнка 120–140 см", "600.00", "board-kid"},
                {4, 2, "Байдарка двухместная", "Для сплава по рекам, весла и гермомешок в комплекте", "1200.00", "kayak-two"},
                {4, 0, "Каяк одноместный", "Устойчивый пластиковый каяк для спокойной воды", "1000.00", "kayak-one"},
                {4, 2, "SUP-борд надувной", "Доска для сапсерфинга с насосом, веслом и страховочным лишем", "800.00", "kayak-sup"},
                {5, 1, "Комплект для скалолазания", "Обвязка, каска, система, карабины и спусковое устройство", "650.00", "climb-set"},
                {5, 2, "Верёвка динамическая 60 м", "Сертифицированная верёвка 9,8 мм для лазания и страховки", "300.00", "climb-rope"},
                {6, 0, "Туристический рюкзак 80 л", "Анатомическая спинка, дождевик и регулируемая подвесная система", "250.00", "pack-80"},
                {6, 0, "Спальник до −15 °C", "Тёплый трёхсезонный спальник-кокон с компрессионным мешком", "200.00", "pack-sleep"},
                {6, 2, "Рюкзак городской 30 л", "Лёгкий рюкзак для коротких маршрутов и тренировок", "150.00", "pack-small"},
        };
        for (Object[] it : items) {
            createListing(partner, cats.get((Integer) it[0]), cts.get((Integer) it[1]), (String) it[2], (String) it[3],
                    (String) it[4], "/img/seed/" + it[5] + ".svg");
        }
        log.info("Созданы демо-данные");
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
                               String price, String photo) {
        Listing l = new Listing();
        l.setPartner(partner);
        l.setCategory(category);
        l.setCity(city);
        l.setTitle(title);
        l.setDescription(description);
        l.setPricePerDay(new BigDecimal(price));
        l.getPhotos().add(photo);
        l.setStatus(ListingStatus.ACTIVE);
        listings.save(l);
    }
}
