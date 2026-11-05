package ru.rental.web;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ru.rental.auth.Auth;
import ru.rental.auth.CurrentUser;
import ru.rental.dto.Dto.*;
import ru.rental.model.BookingStatus;
import ru.rental.model.Role;
import ru.rental.service.BookingService;
import ru.rental.service.ListingService;

import java.util.List;

@RestController
@RequestMapping("/partner")
@RequiredArgsConstructor
@Auth(Role.PARTNER)
@Tag(name = "5. Кабинет партнёра")
public class PartnerController {

    private final ListingService listings;
    private final BookingService bookings;

    @GetMapping("/listings")
    public List<ListingDto> myListings() {
        return listings.ofPartner(CurrentUser.require());
    }

    @GetMapping("/bookings")
    public List<BookingDto> incoming(@RequestParam(required = false) String status) {
        BookingStatus s = status == null || status.isBlank() ? null : BookingStatus.from(status);
        return bookings.ofPartner(CurrentUser.require(), s);
    }

    @PatchMapping("/bookings/{id}/confirm")
    public BookingDto confirm(@PathVariable Long id) {
        return bookings.confirm(CurrentUser.require(), id);
    }

    @PatchMapping("/bookings/{id}/reject")
    public BookingDto reject(@PathVariable Long id) {
        return bookings.reject(CurrentUser.require(), id);
    }

    @PatchMapping("/bookings/{id}/issue")
    public BookingDto issue(@PathVariable Long id) {
        return bookings.issue(CurrentUser.require(), id);
    }

    @PatchMapping("/bookings/{id}/return")
    public BookingDto returned(@PathVariable Long id, @RequestBody(required = false) ReturnRequest request) {
        return bookings.returned(CurrentUser.require(), id, request);
    }
}
