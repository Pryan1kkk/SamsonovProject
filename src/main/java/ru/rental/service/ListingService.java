package ru.rental.service;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.rental.auth.CurrentUser;
import ru.rental.dto.Dto.*;
import ru.rental.model.*;
import ru.rental.repo.*;
import ru.rental.web.ApiException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
@Service
@RequiredArgsConstructor
public class ListingService {
    private final ListingRepository listings;
    private final CategoryRepository categories;
    private final CityRepository cities;
    private final BookingRepository bookings;
    private final ReviewRepository reviews;
    @Transactional(readOnly = true)
    public List<ListingDto> search(Long categoryId, Long cityId, LocalDate from, LocalDate to,
                                   BigDecimal priceMin, BigDecimal priceMax, String q, String sort) {
        if ((from == null) != (to == null)) {
            throw ApiException.badRequest("Укажите обе даты: date_from и date_to");
        }
        if (from != null && to.isBefore(from)) {
            throw ApiException.badRequest("date_to не может быть раньше date_from");
        }
        Specification<Listing> spec = (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            p.add(cb.equal(root.get("status"), ListingStatus.ACTIVE));
            if (categoryId != null) {
                p.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (cityId != null) {
                p.add(cb.equal(root.get("city").get("id"), cityId));
            }
            if (priceMin != null) {
                p.add(cb.greaterThanOrEqualTo(root.<BigDecimal>get("pricePerDay"), priceMin));
            }
            if (priceMax != null) {
                p.add(cb.lessThanOrEqualTo(root.<BigDecimal>get("pricePerDay"), priceMax));
            }
            if (q != null && !q.isBlank()) {
                p.add(cb.like(cb.lower(root.<String>get("title")), "%" + (q.trim().length() > 100 ? q.trim().substring(0, 100) : q.trim()).toLowerCase() + "%"));
            }
            if (from != null) {
                Subquery<Long> busy = query.subquery(Long.class);
                Root<Booking> b = busy.from(Booking.class);
                busy.select(b.<Long>get("id")).where(
                        cb.equal(b.get("listing").get("id"), root.get("id")),
                        b.get("status").in(BookingStatus.BLOCKING),
                        cb.lessThanOrEqualTo(b.<LocalDate>get("dateFrom"), to),
                        cb.greaterThanOrEqualTo(b.<LocalDate>get("dateTo"), from));
                p.add(cb.not(cb.exists(busy)));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
        Sort order = switch (sort == null ? "" : sort) {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "pricePerDay");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "pricePerDay");
            default -> Sort.by(Sort.Direction.DESC, "id");
        };
        Map<Long, Double> ratings = new HashMap<>();
        for (Object[] row : reviews.averagesForListings(TargetType.LISTING)) {
            ratings.put((Long) row[0], (Double) row[1]);
        }
        return listings.findAll(spec, order).stream()
                .map(l -> ListingDto.from(l, ratings.get(l.getId())))
                .toList();
    }
    @Transactional(readOnly = true)
    public ListingDto get(Long id) {
        Listing l = find(id);
        if (l.getStatus() != ListingStatus.ACTIVE && !canSeeInactive(l, CurrentUser.get())) {
            throw ApiException.notFound("Объявление не найдено");
        }
        return ListingDto.from(l, reviews.avgForListing(TargetType.LISTING, id));
    }
    @Transactional(readOnly = true)
    public List<BusyPeriod> availability(Long id) {
        find(id);
        return bookings.findByListingIdAndStatusInAndDateToGreaterThanEqualOrderByDateFromAsc(
                        id, BookingStatus.BLOCKING, LocalDate.now()).stream()
                .map(b -> new BusyPeriod(b.getDateFrom(), b.getDateTo(), b.getStatus()))
                .toList();
    }
    @Transactional(readOnly = true)
    public List<ListingDto> ofPartner(User me) {
        return listings.findByPartnerIdOrderByIdDesc(me.getId()).stream()
                .map(l -> ListingDto.from(l, null))
                .toList();
    }
    @Transactional
    public ListingDto create(User me, ListingRequest r) {
        Listing l = new Listing();
        l.setPartner(me);
        l.setCategory(categories.findById(r.categoryId())
                .orElseThrow(() -> ApiException.badRequest("Категория не найдена")));
        l.setCity(cities.findById(r.cityId())
                .orElseThrow(() -> ApiException.badRequest("Город не найден")));
        l.setTitle(r.title().trim());
        l.setDescription(r.description());
        l.setPricePerDay(r.pricePerDay());
        if (r.photos() != null) {
            l.getPhotos().addAll(cleanPhotos(r.photos()));
        }
        l.setStatus(me.isVerified() ? ListingStatus.ACTIVE : ListingStatus.PENDING);
        listings.save(l);
        return ListingDto.from(l, null);
    }
    @Transactional
    public ListingDto update(User me, Long id, ListingPatch r) {
        Listing l = ownListing(me, id);
        if (r.categoryId() != null) {
            l.setCategory(categories.findById(r.categoryId())
                    .orElseThrow(() -> ApiException.badRequest("Категория не найдена")));
        }
        if (r.cityId() != null) {
            l.setCity(cities.findById(r.cityId())
                    .orElseThrow(() -> ApiException.badRequest("Город не найден")));
        }
        if (r.title() != null && !r.title().isBlank()) {
            l.setTitle(r.title().trim());
        }
        if (r.description() != null) {
            l.setDescription(r.description());
        }
        if (r.pricePerDay() != null) {
            l.setPricePerDay(r.pricePerDay());
        }
        if (r.photos() != null) {
            l.getPhotos().clear();
            l.getPhotos().addAll(cleanPhotos(r.photos()));
        }
        return ListingDto.from(l, null);
    }
    @Transactional
    public void hide(User me, Long id) {
        ownListing(me, id).setStatus(ListingStatus.HIDDEN);
    }
    private static List<String> cleanPhotos(List<String> photos) {
        return photos.stream()
                .map(String::trim)
                .filter((p) -> !p.isEmpty())
                .peek((p) -> {
                    boolean local = p.startsWith("/uploads/") || p.startsWith("/img/");
                    boolean remote = p.startsWith("http://") || p.startsWith("https://");
                    if (p.length() > 255 || !(local || remote)) {
                        throw ApiException.badRequest("Некорректная ссылка на фото: допустимы адреса http(s) и загруженные файлы");
                    }
                })
                .toList();
    }
    @Transactional
    public ListingDto restore(User me, Long id) {
        Listing l = ownListing(me, id);
        if (l.getStatus() != ListingStatus.HIDDEN) {
            throw ApiException.badRequest("Вернуть можно только скрытое объявление");
        }
        l.setStatus(me.isVerified() ? ListingStatus.ACTIVE : ListingStatus.PENDING);
        return ListingDto.from(l, null);
    }
    private Listing find(Long id) {
        return listings.findById(id).orElseThrow(() -> ApiException.notFound("Объявление не найдено"));
    }
    private Listing ownListing(User me, Long id) {
        Listing l = find(id);
        if (!l.getPartner().getId().equals(me.getId())) {
            throw ApiException.forbidden("Это не ваше объявление");
        }
        if (l.getStatus() == ListingStatus.BLOCKED) {
            throw ApiException.forbidden("Объявление скрыто администрацией, изменить или вернуть его нельзя");
        }
        return l;
    }
    private boolean canSeeInactive(Listing l, User viewer) {
        return viewer != null
                && (viewer.getRole() == Role.ADMIN || l.getPartner().getId().equals(viewer.getId()));
    }
}
