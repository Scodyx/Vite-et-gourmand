package fr.vitegourmand.menu.controller;

import fr.vitegourmand.common.exception.BusinessException;
import fr.vitegourmand.common.exception.NotFoundException;
import fr.vitegourmand.dish.entity.Dish;
import fr.vitegourmand.dish.entity.DishType;
import fr.vitegourmand.dish.repository.DishRepository;
import fr.vitegourmand.menu.entity.Menu;
import fr.vitegourmand.menu.entity.MenuImage;
import fr.vitegourmand.menu.repository.MenuRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import org.hibernate.validator.constraints.URL;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/menus")
public class EmployeeMenuController {
    private final MenuRepository menus;
    private final DishRepository dishes;

    public EmployeeMenuController(MenuRepository menus, DishRepository dishes) {
        this.menus = menus;
        this.dishes = dishes;
    }

    public record Input(
            @NotBlank String title,
            @NotBlank String description,
            @NotBlank String conditions,
            @Min(1) int minimumPersons,
            @NotNull @DecimalMin(value = "0", inclusive = false) BigDecimal basePrice,
            @Min(0) int availableStock,
            boolean active,
            @NotBlank String theme,
            @NotBlank String diet,
            @URL String imageUrl) {}

    public record View(
            Long id,
            String title,
            String slug,
            String description,
            String conditions,
            int minimumPersons,
            BigDecimal basePrice,
            int availableStock,
            boolean active,
            String theme,
            String diet,
            String imageUrl,
            Instant updatedAt) {}

    public record DishItem(Long id, String name, DishType type, boolean active) {}

    public record DishesView(
            Long menuId, String title, boolean active, List<DishItem> dishes, int dishCount) {}

    public record DishIds(@NotNull List<@NotNull Long> dishIds) {}

    @GetMapping
    @Transactional(readOnly = true)
    List<View> all() {
        return menus.findAll().stream().map(this::view).toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    View one(@PathVariable Long id) {
        return view(menu(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    View create(@Valid @RequestBody Input request) {
        ensureUniqueTitle(request.title(), null);
        var menu = new Menu();
        menu.setSlug(uniqueSlug(request.title()));
        apply(menu, request);
        return view(menus.save(menu));
    }

    @PutMapping("/{id}")
    @Transactional
    View update(@PathVariable Long id, @Valid @RequestBody Input request) {
        var menu = menu(id);
        ensureUniqueTitle(request.title(), id);
        apply(menu, request);
        return view(menu);
    }

    @PatchMapping("/{id}/enabled")
    @Transactional
    View enabled(@PathVariable Long id, @RequestParam boolean value) {
        var menu = menu(id);
        menu.setActive(value);
        menu.touch();
        return view(menu);
    }

    @GetMapping("/{id}/dishes")
    @Transactional(readOnly = true)
    DishesView dishes(@PathVariable Long id) {
        return dishesView(menu(id));
    }

    @PostMapping("/{id}/dishes/{dishId}")
    @Transactional
    DishesView addDish(@PathVariable Long id, @PathVariable Long dishId) {
        var menu = menu(id);
        var dish = dish(dishId);
        if (!dish.isActive()) throw new BusinessException("Un plat inactif ne peut pas être ajouté");
        if (!menu.getDishes().add(dish))
            throw new BusinessException("Ce plat est déjà associé au menu");
        menu.touch();
        return dishesView(menu);
    }

    @PutMapping("/{id}/dishes")
    @Transactional
    DishesView replaceDishes(@PathVariable Long id, @Valid @RequestBody DishIds request) {
        var menu = menu(id);
        if (new HashSet<>(request.dishIds()).size() != request.dishIds().size())
            throw new BusinessException("La liste contient un plat en doublon");
        var replacements = request.dishIds().stream().map(this::dish).toList();
        if (replacements.stream().anyMatch(value -> !value.isActive()))
            throw new BusinessException("Un plat inactif ne peut pas être ajouté");
        menu.getDishes().clear();
        menu.getDishes().addAll(replacements);
        menu.touch();
        return dishesView(menu);
    }

    @DeleteMapping("/{id}/dishes/{dishId}")
    @Transactional
    DishesView removeDish(@PathVariable Long id, @PathVariable Long dishId) {
        var menu = menu(id);
        var dish = dish(dishId);
        if (!menu.getDishes().remove(dish))
            throw new BusinessException("Ce plat n'est pas associé au menu");
        menu.touch();
        return dishesView(menu);
    }

    private Menu menu(Long id) {
        return menus.findById(id).orElseThrow(() -> new NotFoundException("Menu introuvable"));
    }

    private Dish dish(Long id) {
        return dishes.findById(id).orElseThrow(() -> new NotFoundException("Plat introuvable"));
    }

    private DishesView dishesView(Menu menu) {
        var values =
                menu.getDishes().stream()
                        .sorted(Comparator.comparing(Dish::getType).thenComparing(Dish::getName))
                        .map(
                                value ->
                                        new DishItem(value.getId(), value.getName(), value.getType(), value.isActive()))
                        .toList();
        return new DishesView(menu.getId(), menu.getTitle(), menu.isActive(), values, values.size());
    }

    private void apply(Menu menu, Input request) {
        menu.setTitle(request.title().trim());
        menu.setDescription(request.description().trim());
        menu.setConditions(request.conditions().trim());
        menu.setMinimumPersons(request.minimumPersons());
        menu.setBasePrice(request.basePrice());
        menu.setAvailableStock(request.availableStock());
        menu.setActive(request.active());
        menu.setTheme(request.theme().trim());
        menu.setDiet(request.diet().trim());
        applyImage(menu, request.imageUrl());
        menu.touch();
    }

    private void applyImage(Menu menu, String value) {
        String url = value == null || value.isBlank() ? null : value.trim();
        if (url == null) {
            menu.getImages().clear();
            return;
        }
        MenuImage image =
                menu.getImages().stream()
                        .findFirst()
                        .orElseGet(
                                () -> {
                                    var created = new MenuImage();
                                    created.setMenu(menu);
                                    created.setDisplayOrder(1);
                                    menu.getImages().add(created);
                                    return created;
                                });
        image.setImageUrl(url);
        image.setAltText("Présentation de " + menu.getTitle());
    }

    private void ensureUniqueTitle(String title, Long id) {
        menus
                .findByTitleIgnoreCase(title.trim())
                .filter(other -> !other.getId().equals(id))
                .ifPresent(
                        other -> {
                            throw new BusinessException("Ce nom de menu existe déjà");
                        });
    }

    private String uniqueSlug(String title) {
        String base =
                Normalizer.normalize(title.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                        .replaceAll("\\p{M}", "")
                        .replaceAll("[^a-z0-9]+", "-")
                        .replaceAll("(^-|-$)", "");
        String candidate = base;
        int suffix = 2;
        while (menus.findBySlug(candidate).isPresent()) candidate = base + "-" + suffix++;
        return candidate;
    }

    private View view(Menu menu) {
        String image = menu.getImages().stream().findFirst().map(MenuImage::getImageUrl).orElse(null);
        return new View(
                menu.getId(),
                menu.getTitle(),
                menu.getSlug(),
                menu.getDescription(),
                menu.getConditions(),
                menu.getMinimumPersons(),
                menu.getBasePrice(),
                menu.getAvailableStock(),
                menu.isActive(),
                menu.getTheme(),
                menu.getDiet(),
                image,
                menu.getUpdatedAt());
    }
}
