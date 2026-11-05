package ru.rental.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import ru.rental.model.User;
import ru.rental.service.AuthService;
import ru.rental.web.ApiException;

import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final AuthService authService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod hm)) {
            return true; // статические ресурсы, Swagger и т.п.
        }

        User user = null;
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            user = authService.findUserByToken(header.substring(7).trim()).orElse(null);
        }
        if (user != null) {
            CurrentUser.set(user);
        }

        Auth auth = hm.getMethodAnnotation(Auth.class);
        if (auth == null) {
            auth = hm.getBeanType().getAnnotation(Auth.class);
        }
        if (auth == null) {
            return true; // публичный эндпоинт
        }
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Требуется авторизация: передайте заголовок Authorization: Bearer <token>");
        }
        if (auth.value().length > 0 && !Arrays.asList(auth.value()).contains(user.getRole())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Недостаточно прав для этого действия");
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        CurrentUser.clear();
    }
}
