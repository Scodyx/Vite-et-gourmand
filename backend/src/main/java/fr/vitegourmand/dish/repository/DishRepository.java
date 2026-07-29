package fr.vitegourmand.dish.repository;

import fr.vitegourmand.dish.entity.Dish;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface DishRepository extends JpaRepository<Dish, Long> {
    interface MenuCount {
        Long getDishId();

        long getMenuCount();
    }

    @Override
    @EntityGraph(attributePaths = "allergens")
    List<Dish> findAll();

    Optional<Dish> findByNameIgnoreCase(String name);

    @Query(value = "select count(*) from menu_dish where dish_id=:dishId", nativeQuery = true)
    long countMenusByDishId(Long dishId);

    @Query(
            value = "select dish_id as dishId,count(*) as menuCount from menu_dish group by dish_id",
            nativeQuery = true)
    List<MenuCount> countMenusByDish();
}
