package ru.rental.auth;
import org.springframework.http.HttpStatus;
import ru.rental.model.User;
import ru.rental.web.ApiException;
public final class CurrentUser {
    private static final ThreadLocal<User> HOLDER = new ThreadLocal<>();
    private CurrentUser() {
    }
    static void set(User user) {
        HOLDER.set(user);
    }
    static void clear() {
        HOLDER.remove();
    }
    public static User get() {
        return HOLDER.get();
    }
    public static User require() {
        User u = HOLDER.get();
        if (u == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Требуется авторизация");
        }
        return u;
    }
}
