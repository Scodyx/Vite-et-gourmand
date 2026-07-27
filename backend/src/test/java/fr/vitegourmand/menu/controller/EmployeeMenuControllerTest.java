package fr.vitegourmand.menu.controller;

import fr.vitegourmand.common.exception.NotFoundException;
import fr.vitegourmand.dish.entity.Dish;
import fr.vitegourmand.menu.entity.Menu;
import fr.vitegourmand.menu.repository.MenuRepository;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EmployeeMenuControllerTest {
    private final MenuRepository menus = mock(MenuRepository.class);
    private final EmployeeMenuController controller = new EmployeeMenuController(menus);

    private EmployeeMenuController.Input input() {
        return new EmployeeMenuController.Input(" Menu Smoke ", "Description", "Conditions",
                4, new BigDecimal("12.50"), 40, true, "Saison", "Classique", null);
    }

    @Test void createsValidMenuWithBigDecimalAndGeneratedSlug() {
        when(menus.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        var result = controller.create(input());
        assertThat(result.title()).isEqualTo("Menu Smoke");
        assertThat(result.slug()).isEqualTo("menu-smoke");
        assertThat(result.basePrice()).isEqualByComparingTo("12.50");
        assertThat(result.availableStock()).isEqualTo(40);
    }

    @Test void beanValidationRejectsInvalidCommercialValues() {
        var validator = Validation.buildDefaultValidatorFactory().getValidator();
        var invalid = new EmployeeMenuController.Input("", "D", "C", 0,
                BigDecimal.ZERO, -1, true, "T", "D", "not a url");
        assertThat(validator.validate(invalid)).extracting(v -> v.getPropertyPath().toString())
                .contains("title", "minimumPersons", "basePrice", "availableStock", "imageUrl");
    }

    @Test void updatePreservesDishAssociations() {
        var menu = menu(7L);
        var dish = new Dish();
        menu.getDishes().add(dish);
        when(menus.findById(7L)).thenReturn(Optional.of(menu));
        controller.update(7L, input());
        assertThat(menu.getDishes()).containsExactly(dish);
    }

    @Test void disablesAndReactivatesWithoutDeleting() {
        var menu = menu(3L);
        when(menus.findById(3L)).thenReturn(Optional.of(menu));
        assertThat(controller.enabled(3L, false).active()).isFalse();
        assertThat(controller.enabled(3L, true).active()).isTrue();
        verify(menus, never()).deleteById(any());
    }

    @Test void unknownMenuReturnsNotFound() {
        when(menus.findById(404L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> controller.one(404L)).isInstanceOf(NotFoundException.class);
    }

    private Menu menu(Long id) {
        var menu = new Menu();
        ReflectionTestUtils.setField(menu, "id", id);
        menu.setTitle("Menu"); menu.setSlug("menu"); menu.setDescription("Description");
        menu.setConditions("Conditions"); menu.setMinimumPersons(2);
        menu.setBasePrice(new BigDecimal("10.00")); menu.setAvailableStock(20);
        menu.setTheme("Saison"); menu.setDiet("Classique"); menu.setActive(true);
        return menu;
    }
}
