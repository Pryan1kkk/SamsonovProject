package ru.rental.service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.rental.dto.Dto.NotificationDto;
import ru.rental.model.Notification;
import ru.rental.model.User;
import ru.rental.repo.NotificationRepository;
import ru.rental.web.ApiException;
import java.util.List;
@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notifications;
    @Transactional
    public void send(User user, String message, String link) {
        Notification n = new Notification();
        n.setUser(user);
        n.setMessage(message.length() > 500 ? message.substring(0, 497) + "..." : message);
        n.setLink(link);
        notifications.save(n);
    }
    @Transactional(readOnly = true)
    public List<NotificationDto> mine(User me) {
        return notifications.findByUserIdOrderByIdDesc(me.getId()).stream().map(NotificationDto::from).toList();
    }
    @Transactional
    public void markAllRead(User me) {
        notifications.findByUserIdOrderByIdDesc(me.getId()).forEach(n -> n.setRead(true));
    }
    @Transactional
    public NotificationDto markRead(User me, Long id) {
        Notification n = notifications.findById(id)
                .orElseThrow(() -> ApiException.notFound("Уведомление не найдено"));
        if (!n.getUser().getId().equals(me.getId())) {
            throw ApiException.forbidden("Это не ваше уведомление");
        }
        n.setRead(true);
        return NotificationDto.from(n);
    }
}
