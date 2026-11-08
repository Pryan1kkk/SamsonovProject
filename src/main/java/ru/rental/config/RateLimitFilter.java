package ru.rental.config;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private static final long WINDOW_MS = 60_000;
    private final Map<String, long[]> general = new ConcurrentHashMap<>();
    private final Map<String, long[]> auth = new ConcurrentHashMap<>();
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String uri = request.getRequestURI();
        if (isStatic(uri)) {
            chain.doFilter(request, response);
            return;
        }
        String ip = request.getRemoteAddr();
        boolean limited = !allow(general, ip, 1500)
                || (uri.startsWith("/auth/") && !allow(auth, ip, 40));
        if (limited) {
            response.setStatus(429);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\":\"Слишком много запросов, подождите минуту\"}");
            return;
        }
        chain.doFilter(request, response);
    }
    private static boolean isStatic(String uri) {
        return uri.startsWith("/js/") || uri.startsWith("/css/") || uri.startsWith("/img/")
                || uri.startsWith("/uploads/") || uri.equals("/") || uri.equals("/index.html");
    }
    private static boolean allow(Map<String, long[]> bucket, String key, int limit) {
        long now = System.currentTimeMillis();
        if (bucket.size() > 5000) {
            bucket.clear();
        }
        long[] slot = bucket.compute(key, (k, v) -> {
            if (v == null || now - v[0] > WINDOW_MS) {
                return new long[]{now, 1};
            }
            v[1]++;
            return v;
        });
        return slot[1] <= limit;
    }
}
