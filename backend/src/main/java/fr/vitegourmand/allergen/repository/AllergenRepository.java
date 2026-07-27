package fr.vitegourmand.allergen.repository;
import fr.vitegourmand.allergen.entity.Allergen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;
public interface AllergenRepository extends JpaRepository<Allergen,Long>{
 Optional<Allergen> findByNameIgnoreCase(String name);
 @Query(value="select count(*) from dish_allergen where allergen_id=:id",nativeQuery=true)
 long countDishesByAllergenId(Long id);
}
