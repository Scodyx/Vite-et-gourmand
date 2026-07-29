package fr.vitegourmand.menu.controller;

import fr.vitegourmand.common.exception.NotFoundException;
import fr.vitegourmand.dish.entity.Dish;
import fr.vitegourmand.menu.entity.Menu;
import fr.vitegourmand.menu.repository.MenuRepository;
import fr.vitegourmand.dish.repository.DishRepository;
import fr.vitegourmand.dish.entity.DishType;
import fr.vitegourmand.common.exception.BusinessException;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EmployeeMenuControllerTest {
    private final MenuRepository menus = mock(MenuRepository.class);
    private final DishRepository dishes = mock(DishRepository.class);
    private final EmployeeMenuController controller = new EmployeeMenuController(menus, dishes);

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

    @Test void addsAndRemovesActiveDishExplicitly() {
        var menu = menu(7L);
        var dish = dish(9L, true);
        when(menus.findById(7L)).thenReturn(Optional.of(menu));
        when(dishes.findById(9L)).thenReturn(Optional.of(dish));
        assertThat(controller.addDish(7L, 9L).dishCount()).isEqualTo(1);
        assertThat(controller.removeDish(7L, 9L).dishCount()).isZero();
        verify(menus, never()).deleteById(anyLong());
        verify(dishes, never()).deleteById(anyLong());
    }

    @Test void rejectsInactiveAndDuplicateDish() {
        var menu = menu(7L);
        var inactive = dish(8L, false);
        var active = dish(9L, true);
        menu.getDishes().add(active);
        when(menus.findById(7L)).thenReturn(Optional.of(menu));
        when(dishes.findById(8L)).thenReturn(Optional.of(inactive));
        when(dishes.findById(9L)).thenReturn(Optional.of(active));
        assertThatThrownBy(() -> controller.addDish(7L, 8L)).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> controller.addDish(7L, 9L)).isInstanceOf(BusinessException.class);
        assertThat(menu.getDishes()).containsExactly(active);
    }

    @Test void rejectsMissingAssociationAndUnknownDishWithoutPartialChange() {
        var menu = menu(7L);
        when(menus.findById(7L)).thenReturn(Optional.of(menu));
        when(dishes.findById(404L)).thenReturn(Optional.empty());
        var absent = dish(10L, true);
        when(dishes.findById(10L)).thenReturn(Optional.of(absent));
        assertThatThrownBy(() -> controller.addDish(7L, 404L)).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> controller.removeDish(7L, 10L)).isInstanceOf(BusinessException.class);
        assertThat(menu.getDishes()).isEmpty();
    }

    @Test void atomicReplacementValidatesEverythingBeforeChangingAssociations() {
        var menu = menu(7L);
        var original = dish(1L, true);
        var replacement = dish(2L, true);
        menu.getDishes().add(original);
        when(menus.findById(7L)).thenReturn(Optional.of(menu));
        when(dishes.findById(2L)).thenReturn(Optional.of(replacement));
        when(dishes.findById(404L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> controller.replaceDishes(7L,
                new EmployeeMenuController.DishIds(List.of(2L, 404L)))).isInstanceOf(NotFoundException.class);
        assertThat(menu.getDishes()).containsExactly(original);
        assertThat(controller.replaceDishes(7L,
                new EmployeeMenuController.DishIds(List.of(2L))).dishes()).extracting("id").containsExactly(2L);
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

    private Dish dish(Long id, boolean active) {
        var dish = new Dish();
        ReflectionTestUtils.setField(dish, "id", id);
        dish.setName("Plat " + id); dish.setType(DishType.MAIN_COURSE); dish.setActive(active);
        return dish;
    }
}
