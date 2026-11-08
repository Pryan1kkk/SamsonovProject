package ru.rental.web;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.rental.auth.Auth;
import ru.rental.auth.CurrentUser;
import ru.rental.dto.Dto.*;
import ru.rental.model.Role;
import ru.rental.service.ListingService;
import ru.rental.service.ReviewService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
@RestController
@RequiredArgsConstructor
@Tag(name = "3. Каталог и объявления")
public class ListingController {
    private final ListingService listings;
    private final ReviewService reviews;
    @GetMapping("/listings")
    public List<ListingDto> search(
            @RequestParam(name = "category_id", required = false) Long categoryId,
            @RequestParam(name = "city_id", required = false) Long cityId,
            @RequestParam(name = "date_from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(name = "date_to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(name = "price_min", required = false) BigDecimal priceMin,
            @RequestParam(name = "price_max", required = false) BigDecimal priceMax,
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "sort", required = false) String sort) {
        return listings.search(categoryId, cityId, dateFrom, dateTo, priceMin, priceMax, q, sort);
    }
    @GetMapping("/listings/{id}")
    public ListingDto get(@PathVariable Long id) {
        return listings.get(id);
    }
    @GetMapping("/listings/{id}/availability")
    public List<BusyPeriod> availability(@PathVariable Long id) {
        return listings.availability(id);
    }
    @GetMapping("/listings/{id}/reviews")
    public List<ReviewDto> listingReviews(@PathVariable Long id) {
        return reviews.forListing(id);
    }
    @Auth(Role.PARTNER)
    @PostMapping("/listings")
    @ResponseStatus(HttpStatus.CREATED)
    public ListingDto create(@Valid @RequestBody ListingRequest request) {
        return listings.create(CurrentUser.require(), request);
    }
    @Auth(Role.PARTNER)
    @PatchMapping("/listings/{id}")
    public ListingDto update(@PathVariable Long id, @Valid @RequestBody ListingPatch request) {
        return listings.update(CurrentUser.require(), id, request);
    }
    @Auth(Role.PARTNER)
    @PatchMapping("/listings/{id}/restore")
    public ListingDto restore(@PathVariable Long id) {
        return listings.restore(CurrentUser.require(), id);
    }
    @Auth(Role.PARTNER)
    @DeleteMapping("/listings/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void hide(@PathVariable Long id) {
        listings.hide(CurrentUser.require(), id);
    }
}
