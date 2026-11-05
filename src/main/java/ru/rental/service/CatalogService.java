package ru.rental.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.rental.dto.Dto.NamedDto;
import ru.rental.model.Category;
import ru.rental.model.City;
import ru.rental.repo.CategoryRepository;
import ru.rental.repo.CityRepository;
import ru.rental.web.ApiException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final CategoryRepository categories;
    private final CityRepository cities;

    @Transactional(readOnly = true)
    public List<NamedDto> categories() {
        return categories.findAll(Sort.by("name")).stream().map(c -> new NamedDto(c.getId(), c.getName())).toList();
    }

    @Transactional(readOnly = true)
    public List<NamedDto> cities() {
        return cities.findAll(Sort.by("name")).stream().map(c -> new NamedDto(c.getId(), c.getName())).toList();
    }

    @Transactional
    public NamedDto addCategory(String name) {
        String n = name.trim();
        if (categories.existsByNameIgnoreCase(n)) {
            throw ApiException.conflict("Такая категория уже есть");
        }
        Category c = new Category();
        c.setName(n);
        categories.save(c);
        return new NamedDto(c.getId(), c.getName());
    }

    @Transactional
    public NamedDto addCity(String name) {
        String n = name.trim();
        if (cities.existsByNameIgnoreCase(n)) {
            throw ApiException.conflict("Такой город уже есть");
        }
        City c = new City();
        c.setName(n);
        cities.save(c);
        return new NamedDto(c.getId(), c.getName());
    }
}
