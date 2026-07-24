package fr.vitegourmand.menu.repository;

import fr.vitegourmand.menu.entity.Menu;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface MenuRepository extends JpaRepository<Menu, Long>, JpaSpecificationExecutor<Menu> {
    Page<Menu> findByActiveTrue(Pageable pageable);
    Optional<Menu> findBySlugAndActiveTrue(String slug);
    Optional<Menu> findBySlug(String slug);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Menu> findLockedById(Long id);
}
