package ru.rental.repo;
import org.springframework.data.jpa.repository.JpaRepository;
import ru.rental.model.City;
public interface CityRepository extends JpaRepository<City, Long> {
    boolean existsByNameIgnoreCase(String name);
}
