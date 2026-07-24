package fr.vitegourmand.dish.repository;
import fr.vitegourmand.dish.entity.Dish;
import org.springframework.data.jpa.repository.*;
public interface DishRepository extends JpaRepository<Dish,Long>{}
