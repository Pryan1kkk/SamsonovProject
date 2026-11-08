package ru.rental.web;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.rental.auth.Auth;
import ru.rental.auth.CurrentUser;
import ru.rental.dto.Dto.*;
import ru.rental.model.Role;
import ru.rental.service.BookingCsv;
import ru.rental.service.BookingService;
import java.util.List;
@RestController
@RequiredArgsConstructor
@Tag(name = "4. Бронирования (клиент)")
public class BookingController {
    private final BookingService bookings;
    @Auth(Role.CLIENT)
    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingDto create(@Valid @RequestBody BookingRequest request) {
        return bookings.create(CurrentUser.require(), request);
    }
    @Auth(Role.CLIENT)
    @GetMapping("/bookings")
    public List<BookingDto> mine() {
        return bookings.ofClient(CurrentUser.require());
    }
    @Auth(Role.CLIENT)
    @GetMapping("/bookings/export")
    public ResponseEntity<String> export() {
        return CsvResponse.of("my-bookings.csv", BookingCsv.build(bookings.ofClient(CurrentUser.require())));
    }
    @Auth
    @GetMapping("/bookings/{id}")
    public BookingDto get(@PathVariable Long id) {
        return bookings.get(CurrentUser.require(), id);
    }
    @Auth(Role.CLIENT)
    @PatchMapping("/bookings/{id}/cancel")
    public BookingDto cancel(@PathVariable Long id) {
        return bookings.cancel(CurrentUser.require(), id);
    }
    @Auth(Role.CLIENT)
    @PostMapping("/bookings/{id}/pay")
    public BookingDto pay(@PathVariable Long id) {
        return bookings.pay(CurrentUser.require(), id);
    }
}
