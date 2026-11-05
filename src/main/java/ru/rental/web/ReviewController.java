package ru.rental.web;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ru.rental.auth.Auth;
import ru.rental.auth.CurrentUser;
import ru.rental.dto.Dto.*;
import ru.rental.model.Role;
import ru.rental.service.ReviewService;

@RestController
@RequiredArgsConstructor
@Tag(name = "6. Отзывы")
public class ReviewController {

    private final ReviewService reviews;

    @Auth({Role.CLIENT, Role.PARTNER})
    @PostMapping("/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewDto create(@Valid @RequestBody ReviewRequest request) {
        return reviews.create(CurrentUser.require(), request);
    }
}
