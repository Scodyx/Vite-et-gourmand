package fr.vitegourmand.allergen.repository;
import fr.vitegourmand.allergen.entity.Allergen;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface AllergenRepository extends JpaRepository<Allergen,Long>{
 Optional<Allergen> findByNameIgnoreCase(String name);
}
