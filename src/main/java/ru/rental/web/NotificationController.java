package ru.rental.web;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import ru.rental.auth.Auth;
import ru.rental.auth.CurrentUser;
import ru.rental.dto.Dto.NotificationDto;
import ru.rental.service.NotificationService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Auth
@Tag(name = "7. Уведомления")
public class NotificationController {

    private final NotificationService notifications;

    @GetMapping("/notifications")
    public List<NotificationDto> mine() {
        return notifications.mine(CurrentUser.require());
    }

    @PatchMapping("/notifications/{id}/read")
    public NotificationDto read(@PathVariable Long id) {
        return notifications.markRead(CurrentUser.require(), id);
    }
}
