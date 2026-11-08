package ru.rental.web;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.rental.auth.Auth;
import ru.rental.dto.Dto.*;
import ru.rental.model.DisputeStatus;
import ru.rental.model.ListingStatus;
import ru.rental.model.Role;
import ru.rental.service.AdminService;
import ru.rental.service.CatalogService;
import java.util.List;
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Auth(Role.ADMIN)
@Tag(name = "8. Администратор")
public class AdminController {
    private final AdminService admin;
    private final CatalogService catalog;
    @GetMapping("/stats")
    public StatsDto stats() {
        return admin.stats();
    }
    @GetMapping("/partners/pending")
    public List<UserDto> pendingPartners() {
        return admin.pendingPartners();
    }
    @PatchMapping("/partners/{id}/verify")
    public UserDto verify(@PathVariable Long id) {
        return admin.verifyPartner(id);
    }
    @GetMapping("/listings")
    public List<ListingDto> allListings(@RequestParam(required = false) String status) {
        ListingStatus s = status == null || status.isBlank() ? null : ListingStatus.from(status);
        return admin.listings(s);
    }
    @PatchMapping("/listings/{id}/moderate")
    public ListingDto moderate(@PathVariable Long id, @Valid @RequestBody ModerateRequest request) {
        return admin.moderateListing(id, request.status());
    }
    @GetMapping("/disputes")
    public List<DisputeDto> disputes(@RequestParam(required = false) String status) {
        DisputeStatus s = status == null || status.isBlank() ? null : DisputeStatus.from(status);
        return admin.disputes(s);
    }
    @PatchMapping("/disputes/{id}/resolve")
    public DisputeDto resolve(@PathVariable Long id, @Valid @RequestBody ResolveRequest request) {
        return admin.resolve(id, request.resolution());
    }
    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public NamedDto addCategory(@Valid @RequestBody NameRequest request) {
        return catalog.addCategory(request.name());
    }
    @PostMapping("/cities")
    @ResponseStatus(HttpStatus.CREATED)
    public NamedDto addCity(@Valid @RequestBody NameRequest request) {
        return catalog.addCity(request.name());
    }
}
