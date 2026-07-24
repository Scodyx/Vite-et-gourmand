package fr.vitegourmand.menu.repository;

import fr.vitegourmand.menu.entity.Menu;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MenuRepository extends JpaRepository<Menu, Long> {
    Page<Menu> findByActiveTrue(Pageable pageable);
    Optional<Menu> findBySlugAndActiveTrue(String slug);
}
