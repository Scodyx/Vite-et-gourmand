package fr.vitegourmand.catalog.service;

import fr.vitegourmand.allergen.entity.Allergen;
import fr.vitegourmand.allergen.repository.AllergenRepository;
import fr.vitegourmand.catalog.dto.CatalogDtos.DishInput;
import fr.vitegourmand.common.exception.BusinessException;
import fr.vitegourmand.common.exception.NotFoundException;
import fr.vitegourmand.dish.entity.Dish;
import fr.vitegourmand.dish.entity.DishType;
import fr.vitegourmand.dish.repository.DishRepository;
import fr.vitegourmand.openinghours.repository.OpeningHoursRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashSet;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CatalogManagementServiceDishTest {
    @Mock DishRepository dishes;
    @Mock AllergenRepository allergens;
    @Mock OpeningHoursRepository hours;
    CatalogManagementService service;

    @BeforeEach
    void setUp() {
        service = new CatalogManagementService(dishes, allergens, hours);
    }

    @Test
    void createsAndNormalizesDishWithoutAssociationsFromTheRequest() {
        when(dishes.findByNameIgnoreCase("Soupe maison")).thenReturn(Optional.empty());
        when(dishes.save(any())).thenAnswer(invocation -> {
            Dish dish = invocation.getArgument(0);
            ReflectionTestUtils.setField(dish, "id", 12L);
            return dish;
        });
        when(dishes.countMenusByDishId(12L)).thenReturn(0L);

        var result = service.createDish(new DishInput("  Soupe   maison  ", "  Fraîche  ", DishType.ENTRY, true));

        assertThat(result.name()).isEqualTo("Soupe maison");
        assertThat(result.description()).isEqualTo("Fraîche");
        assertThat(result.active()).isTrue();
        assertThat(result.allergens()).isEmpty();
        verify(dishes).save(any(Dish.class));
    }

    @Test
    void rejectsDuplicateNameIgnoringCase() {
        Dish existing = dish(3L, "Soupe maison");
        when(dishes.findByNameIgnoreCase("soupe maison")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.createDish(
                new DishInput(" soupe maison ", null, DishType.ENTRY, true)))
                .isInstanceOf(BusinessException.class);
        verify(dishes, never()).save(any());
    }

    @Test
    void updatePreservesMenuAndAllergenAssociations() {
        Dish existing = dish(7L, "Ancien nom");
        Allergen allergen = new Allergen();
        allergen.setName("Gluten");
        existing.setAllergens(new HashSet<>(java.util.Set.of(allergen)));
        var sameSet = existing.getAllergens();
        when(dishes.findById(7L)).thenReturn(Optional.of(existing));
        when(dishes.findByNameIgnoreCase("Nouveau nom")).thenReturn(Optional.empty());
        when(dishes.countMenusByDishId(7L)).thenReturn(2L);

        var result = service.updateDish(7L,
                new DishInput(" Nouveau   nom ", "Description", DishType.MAIN_COURSE, false));

        assertThat(existing.getAllergens()).isSameAs(sameSet).containsExactly(allergen);
        assertThat(result.allergens()).extracting("name").containsExactly("Gluten");
        assertThat(result.menuCount()).isEqualTo(2);
        verify(dishes, never()).delete(any());
    }

    @Test
    void activatesAndDeactivatesWithoutPhysicalDeletion() {
        Dish existing = dish(8L, "Dessert");
        when(dishes.findById(8L)).thenReturn(Optional.of(existing));
        when(dishes.countMenusByDishId(8L)).thenReturn(0L);

        assertThat(service.enableDish(8L, false).active()).isFalse();
        assertThat(service.enableDish(8L, true).active()).isTrue();
        verify(dishes, never()).delete(any());
    }

    @Test
    void returnsNotFoundForUnknownDish() {
        when(dishes.findById(404L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.dish(404L)).isInstanceOf(NotFoundException.class);
    }

    private Dish dish(Long id, String name) {
        Dish dish = new Dish();
        ReflectionTestUtils.setField(dish, "id", id);
        dish.setName(name);
        dish.setType(DishType.ENTRY);
        dish.setActive(true);
        return dish;
    }
}
