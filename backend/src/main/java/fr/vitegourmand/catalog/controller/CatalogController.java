package fr.vitegourmand.catalog.controller;

import fr.vitegourmand.catalog.dto.CatalogDtos.AdminAllergenView;
import fr.vitegourmand.catalog.dto.CatalogDtos.AllergenIds;
import fr.vitegourmand.catalog.dto.CatalogDtos.AllergenInput;
import fr.vitegourmand.catalog.dto.CatalogDtos.AllergenView;
import fr.vitegourmand.catalog.dto.CatalogDtos.DishAllergensView;
import fr.vitegourmand.catalog.dto.CatalogDtos.DishInput;
import fr.vitegourmand.catalog.dto.CatalogDtos.DishView;
import fr.vitegourmand.catalog.dto.CatalogDtos.HoursInput;
import fr.vitegourmand.catalog.dto.CatalogDtos.HoursView;
import fr.vitegourmand.catalog.service.CatalogManagementService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CatalogController {
    private final CatalogManagementService service;

    public CatalogController(CatalogManagementService service) {
        this.service = service;
    }

    @GetMapping("/api/v1/public/opening-hours")
    List<HoursView> publicHours() {
        return service.hours();
    }

    @GetMapping("/api/v1/employee/opening-hours")
    List<HoursView> hours() {
        return service.hours();
    }

    @GetMapping("/api/v1/admin/opening-hours")
    List<HoursView> adminHours() {
        return service.hours();
    }

    @PutMapping("/api/v1/admin/opening-hours/{id}")
    HoursView hours(@PathVariable Long id, @Valid @RequestBody HoursInput r) {
        return service.updateHours(id, r);
    }

    @GetMapping("/api/v1/employee/allergens")
    List<AllergenView> allergens() {
        return service.allergens();
    }

    @GetMapping("/api/v1/admin/allergens")
    List<AdminAllergenView> adminAllergens() {
        return service.adminAllergens();
    }

    @GetMapping("/api/v1/admin/allergens/{id}")
    AdminAllergenView allergen(@PathVariable Long id) {
        return service.allergen(id);
    }

    @PostMapping("/api/v1/admin/allergens")
    @ResponseStatus(HttpStatus.CREATED)
    AllergenView allergen(@Valid @RequestBody AllergenInput r) {
        return service.createAllergen(r);
    }

    @PutMapping("/api/v1/admin/allergens/{id}")
    AllergenView allergen(@PathVariable Long id, @Valid @RequestBody AllergenInput r) {
        return service.updateAllergen(id, r);
    }

    @GetMapping("/api/v1/employee/dishes")
    List<DishView> dishes() {
        return service.dishes();
    }

    @GetMapping("/api/v1/admin/dishes")
    List<DishView> adminDishes() {
        return service.dishes();
    }

    @GetMapping("/api/v1/admin/dishes/{id}")
    DishView dish(@PathVariable Long id) {
        return service.dish(id);
    }

    @PostMapping("/api/v1/admin/dishes")
    @ResponseStatus(HttpStatus.CREATED)
    DishView dish(@Valid @RequestBody DishInput r) {
        return service.createDish(r);
    }

    @PutMapping("/api/v1/admin/dishes/{id}")
    DishView dish(@PathVariable Long id, @Valid @RequestBody DishInput r) {
        return service.updateDish(id, r);
    }

    @PatchMapping("/api/v1/admin/dishes/{id}/enabled")
    DishView enabledDish(@PathVariable Long id, @RequestParam boolean value) {
        return service.enableDish(id, value);
    }

    @GetMapping("/api/v1/admin/dishes/{id}/allergens")
    DishAllergensView dishAllergens(@PathVariable Long id) {
        return service.dishAllergens(id);
    }

    @PutMapping("/api/v1/admin/dishes/{id}/allergens")
    DishAllergensView dishAllergens(@PathVariable Long id, @Valid @RequestBody AllergenIds r) {
        return service.replaceAllergens(id, r);
    }

    @PostMapping("/api/v1/admin/dishes/{id}/allergens/{allergenId}")
    DishAllergensView addAllergen(@PathVariable Long id, @PathVariable Long allergenId) {
        return service.addAllergen(id, allergenId);
    }

    @DeleteMapping("/api/v1/admin/dishes/{id}/allergens/{allergenId}")
    DishAllergensView removeAllergen(@PathVariable Long id, @PathVariable Long allergenId) {
        return service.removeAllergen(id, allergenId);
    }
}
