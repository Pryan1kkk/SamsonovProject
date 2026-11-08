package ru.rental.web;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.rental.auth.Auth;
import ru.rental.auth.CurrentUser;
import ru.rental.dto.Dto.*;
import ru.rental.service.AuthService;
import ru.rental.service.ReviewService;
import java.util.List;
@RestController
@RequiredArgsConstructor
@Tag(name = "1. Аутентификация и профиль")
public class AuthController {
    private final AuthService authService;
    private final ReviewService reviewService;
    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }
    @PostMapping("/auth/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
    @PostMapping("/auth/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader(value = "Authorization", required = false) String header) {
        if (header != null && header.startsWith("Bearer ")) {
            authService.logout(header.substring(7).trim());
        }
    }
    @Auth
    @GetMapping("/users/me")
    public UserDto me() {
        return UserDto.from(CurrentUser.require());
    }
    @Auth
    @PatchMapping("/users/me")
    public UserDto updateMe(@Valid @RequestBody UpdateProfileRequest request) {
        return authService.updateProfile(CurrentUser.require(), request);
    }
    @GetMapping("/users/{id}/reviews")
    public List<ReviewDto> userReviews(@PathVariable Long id) {
        return reviewService.forUser(id);
    }
}
