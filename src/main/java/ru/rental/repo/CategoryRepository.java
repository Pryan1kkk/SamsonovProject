package ru.rental.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.rental.model.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByNameIgnoreCase(String name);
}
