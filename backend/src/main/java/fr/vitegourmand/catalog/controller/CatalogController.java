package fr.vitegourmand.catalog.controller;
import fr.vitegourmand.catalog.dto.CatalogDtos.*;
import fr.vitegourmand.catalog.service.CatalogManagementService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController
public class CatalogController {
 private final CatalogManagementService service;public CatalogController(CatalogManagementService s){service=s;}
 @GetMapping("/api/v1/public/opening-hours") List<HoursView> publicHours(){return service.hours();}
 @GetMapping("/api/v1/employee/opening-hours") List<HoursView> hours(){return service.hours();}
 @PutMapping("/api/v1/employee/opening-hours/{id}") HoursView hours(@PathVariable Long id,@Valid @RequestBody HoursInput r){return service.updateHours(id,r);}
 @GetMapping("/api/v1/employee/allergens") List<AllergenView> allergens(){return service.allergens();}
 @PostMapping("/api/v1/employee/allergens") @ResponseStatus(HttpStatus.CREATED) AllergenView allergen(@Valid @RequestBody AllergenInput r){return service.createAllergen(r);}
 @PutMapping("/api/v1/employee/allergens/{id}") AllergenView allergen(@PathVariable Long id,@Valid @RequestBody AllergenInput r){return service.updateAllergen(id,r);}
 @GetMapping("/api/v1/employee/dishes") List<DishView> dishes(){return service.dishes();}
 @PostMapping("/api/v1/employee/dishes") @ResponseStatus(HttpStatus.CREATED) DishView dish(@Valid @RequestBody DishInput r){return service.createDish(r);}
 @PutMapping("/api/v1/employee/dishes/{id}") DishView dish(@PathVariable Long id,@Valid @RequestBody DishInput r){return service.updateDish(id,r);}
 @DeleteMapping("/api/v1/employee/dishes/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) void disable(@PathVariable Long id){service.disableDish(id);}
}
