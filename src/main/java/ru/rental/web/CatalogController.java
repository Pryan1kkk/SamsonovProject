package ru.rental.web;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.rental.dto.Dto.NamedDto;
import ru.rental.service.CatalogService;
import java.util.List;
@RestController
@RequiredArgsConstructor
@Tag(name = "2. Справочники")
public class CatalogController {
    private final CatalogService catalog;
    @GetMapping("/categories")
    public List<NamedDto> categories() {
        return catalog.categories();
    }
    @GetMapping("/cities")
    public List<NamedDto> cities() {
        return catalog.cities();
    }
}
