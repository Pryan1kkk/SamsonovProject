package ru.rental.service;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.rental.dto.Dto.*;
import ru.rental.model.AuthToken;
import ru.rental.model.Role;
import ru.rental.model.User;
import ru.rental.repo.AuthTokenRepository;
import ru.rental.repo.UserRepository;
import ru.rental.web.ApiException;
import java.security.SecureRandom;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Optional;
@Service
@RequiredArgsConstructor
public class AuthService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final UserRepository users;
    private final AuthTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final Map<String, Integer> failures = new ConcurrentHashMap<>();
    private final Map<String, Instant> lockedUntil = new ConcurrentHashMap<>();
    @Value("${app.token-ttl-days:7}")
    private int tokenTtlDays;
    @Transactional
    public AuthResponse register(RegisterRequest r) {
        if (r.role() == Role.ADMIN) {
            throw ApiException.badRequest("Зарегистрироваться администратором нельзя");
        }
        checkPassword(r.password());
        String email = r.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("Пользователь с таким email уже существует");
        }
        User u = new User();
        u.setName(r.name().trim());
        u.setEmail(email);
        u.setPhone(r.phone() == null ? null : r.phone().trim());
        u.setPasswordHash(encoder.encode(r.password()));
        u.setRole(r.role());
        u.setVerified(r.role() == Role.CLIENT);
        users.save(u);
        return new AuthResponse(issueToken(u), UserDto.from(u));
    }
    @Transactional
    public AuthResponse login(LoginRequest r) {
        String key = r.email().trim().toLowerCase(Locale.ROOT);
        Instant locked = lockedUntil.get(key);
        if (locked != null && locked.isAfter(Instant.now())) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Слишком много неудачных попыток входа. Попробуйте через несколько минут");
        }
        User u = users.findByEmailIgnoreCase(key).orElse(null);
        if (u == null || r.password().getBytes(StandardCharsets.UTF_8).length > 72
                || !encoder.matches(r.password(), u.getPasswordHash())) {
            int count = failures.merge(key, 1, Integer::sum);
            if (count >= 5) {
                failures.remove(key);
                lockedUntil.put(key, Instant.now().plus(5, ChronoUnit.MINUTES));
            }
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Неверный email или пароль");
        }
        failures.remove(key);
        lockedUntil.remove(key);
        tokens.deleteByCreatedAtBefore(Instant.now().minus(tokenTtlDays, ChronoUnit.DAYS));
        return new AuthResponse(issueToken(u), UserDto.from(u));
    }
    private static void checkPassword(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw ApiException.badRequest("Пароль слишком длинный: не более 72 байт (около 36 русских букв)");
        }
    }
    @Transactional
    public void logout(String token) {
        if (token != null && !token.isBlank()) {
            tokens.deleteById(token);
        }
    }
    @Transactional
    public UserDto updateProfile(User me, UpdateProfileRequest r) {
        User u = users.findById(me.getId()).orElseThrow(() -> ApiException.notFound("Пользователь не найден"));
        if (r.name() != null && !r.name().isBlank()) {
            u.setName(r.name().trim());
        }
        if (r.phone() != null) {
            u.setPhone(r.phone());
        }
        if (r.password() != null) {
            checkPassword(r.password());
            u.setPasswordHash(encoder.encode(r.password()));
        }
        return UserDto.from(u);
    }
    @Transactional(readOnly = true)
    public Optional<User> findUserByToken(String token) {
        return tokens.findById(token)
                .filter(t -> t.getCreatedAt().plus(tokenTtlDays, ChronoUnit.DAYS).isAfter(Instant.now()))
                .map(AuthToken::getUser);
    }
    private String issueToken(User u) {
        byte[] raw = new byte[32];
        RANDOM.nextBytes(raw);
        AuthToken t = new AuthToken();
        t.setToken(Base64.getUrlEncoder().withoutPadding().encodeToString(raw));
        t.setUser(u);
        tokens.save(t);
        return t.getToken();
    }
}
