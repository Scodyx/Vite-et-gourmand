package fr.vitegourmand.catalog.service;

import fr.vitegourmand.allergen.entity.Allergen;
import fr.vitegourmand.allergen.repository.AllergenRepository;
import fr.vitegourmand.catalog.dto.CatalogDtos.AdminAllergenView;
import fr.vitegourmand.catalog.dto.CatalogDtos.AllergenIds;
import fr.vitegourmand.catalog.dto.CatalogDtos.AllergenInput;
import fr.vitegourmand.catalog.dto.CatalogDtos.AllergenView;
import fr.vitegourmand.catalog.dto.CatalogDtos.DishAllergensView;
import fr.vitegourmand.catalog.dto.CatalogDtos.DishInput;
import fr.vitegourmand.catalog.dto.CatalogDtos.DishView;
import fr.vitegourmand.catalog.dto.CatalogDtos.HoursInput;
import fr.vitegourmand.catalog.dto.CatalogDtos.HoursView;
import fr.vitegourmand.common.exception.BusinessException;
import fr.vitegourmand.common.exception.NotFoundException;
import fr.vitegourmand.dish.entity.Dish;
import fr.vitegourmand.dish.repository.DishRepository;
import fr.vitegourmand.openinghours.entity.OpeningHours;
import fr.vitegourmand.openinghours.repository.OpeningHoursRepository;
import java.text.Normalizer;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CatalogManagementService {
    private final DishRepository dishes;
    private final AllergenRepository allergens;
    private final OpeningHoursRepository hours;

    public CatalogManagementService(
            DishRepository dishes, AllergenRepository allergens, OpeningHoursRepository hours) {
        this.dishes = dishes;
        this.allergens = allergens;
        this.hours = hours;
    }

    @Transactional(readOnly = true)
    public List<AllergenView> allergens() {
        return allergens.findAll().stream().map(this::view).toList();
    }

    @Transactional(readOnly = true)
    public List<AdminAllergenView> adminAllergens() {
        return allergens.findAll().stream().map(this::adminView).toList();
    }

    @Transactional(readOnly = true)
    public AdminAllergenView allergen(Long id) {
        return adminView(allergenEntity(id));
    }

    @Transactional
    public AllergenView createAllergen(AllergenInput request) {
        ensureUniqueAllergen(request.name(), null);
        var allergen = new Allergen();
        allergen.setName(cleanName(request.name()));
        return view(allergens.save(allergen));
    }

    @Transactional
    public AllergenView updateAllergen(Long id, AllergenInput request) {
        var allergen =
                allergens.findById(id).orElseThrow(() -> new NotFoundException("Allergène introuvable"));
        ensureUniqueAllergen(request.name(), id);
        allergen.setName(cleanName(request.name()));
        return view(allergen);
    }

    @Transactional(readOnly = true)
    public DishAllergensView dishAllergens(Long dishId) {
        return allergensView(dishEntity(dishId));
    }

    @Transactional
    public DishAllergensView addAllergen(Long dishId, Long allergenId) {
        var dish = dishEntity(dishId);
        var allergen = allergenEntity(allergenId);
        if (!dish.getAllergens().add(allergen))
            throw new BusinessException("Cet allergène est déjà associé au plat");
        return allergensView(dish);
    }

    @Transactional
    public DishAllergensView removeAllergen(Long dishId, Long allergenId) {
        var dish = dishEntity(dishId);
        var allergen = allergenEntity(allergenId);
        if (!dish.getAllergens().remove(allergen))
            throw new BusinessException("Cet allergène n'est pas associé au plat");
        return allergensView(dish);
    }

    @Transactional
    public DishAllergensView replaceAllergens(Long dishId, AllergenIds request) {
        var dish = dishEntity(dishId);
        if (new HashSet<>(request.allergenIds()).size() != request.allergenIds().size())
            throw new BusinessException("La liste contient un allergène en doublon");
        var replacements = request.allergenIds().stream().map(this::allergenEntity).toList();
        dish.getAllergens().clear();
        dish.getAllergens().addAll(replacements);
        return allergensView(dish);
    }

    @Transactional(readOnly = true)
    public List<DishView> dishes() {
        Map<Long, Long> menuCounts =
                dishes.countMenusByDish().stream()
                        .collect(
                                Collectors.toMap(
                                        DishRepository.MenuCount::getDishId, DishRepository.MenuCount::getMenuCount));
        return dishes.findAll().stream()
                .map(value -> view(value, menuCounts.getOrDefault(value.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public DishView dish(Long id) {
        return view(dishEntity(id));
    }

    @Transactional
    public DishView createDish(DishInput request) {
        ensureUniqueDish(request.name(), null);
        var dish = new Dish();
        apply(dish, request);
        return view(dishes.save(dish));
    }

    @Transactional
    public DishView updateDish(Long id, DishInput request) {
        var dish = dishEntity(id);
        apply(dish, request);
        return view(dish);
    }

    @Transactional
    public DishView enableDish(Long id, boolean value) {
        var dish = dishEntity(id);
        dish.setActive(value);
        return view(dish);
    }

    @Transactional(readOnly = true)
    public List<HoursView> hours() {
        return hours.findAllByOrderByDisplayOrderAsc().stream().map(this::view).toList();
    }

    @Transactional
    public HoursView updateHours(Long id, HoursInput request) {
        validate(request);
        var value = hours.findById(id).orElseThrow(() -> new NotFoundException("Horaire introuvable"));
        hours
                .findByDayOfWeek(request.dayOfWeek())
                .filter(other -> !other.getId().equals(id))
                .ifPresent(
                        other -> {
                            throw new BusinessException("Ce jour existe déjà");
                        });
        value.setDayOfWeek(request.dayOfWeek());
        value.setClosed(request.closed());
        value.setOpeningTime(request.closed() ? null : request.openingTime());
        value.setClosingTime(request.closed() ? null : request.closingTime());
        value.setDisplayOrder(request.displayOrder());
        return view(value);
    }

    private Dish dishEntity(Long id) {
        return dishes.findById(id).orElseThrow(() -> new NotFoundException("Plat introuvable"));
    }

    private Allergen allergenEntity(Long id) {
        return allergens.findById(id).orElseThrow(() -> new NotFoundException("Allergène introuvable"));
    }

    private void apply(Dish dish, DishInput request) {
        ensureUniqueDish(request.name(), dish.getId());
        dish.setName(request.name().trim().replaceAll("\\s+", " "));
        String description = request.description() == null ? null : request.description().trim();
        dish.setDescription(description == null || description.isBlank() ? null : description);
        dish.setType(request.type());
        dish.setActive(request.active());
        // Les associations menus et allergènes sont volontairement préservées.
    }

    private void ensureUniqueDish(String name, Long id) {
        String normalized = name.trim().replaceAll("\\s+", " ");
        dishes
                .findByNameIgnoreCase(normalized)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(
                        other -> {
                            throw new BusinessException("Ce nom de plat existe déjà");
                        });
    }

    private void validate(HoursInput request) {
        if (!request.closed()
                && (request.openingTime() == null
                        || request.closingTime() == null
                        || !request.openingTime().isBefore(request.closingTime())))
            throw new BusinessException("Les heures d'ouverture doivent précéder la fermeture");
    }

    private void ensureUniqueAllergen(String name, Long id) {
        String cleaned = cleanName(name);
        allergens
                .findByNameIgnoreCase(cleaned)
                .filter(value -> !value.getId().equals(id))
                .ifPresent(
                        value -> {
                            throw new BusinessException("Cet allergène existe déjà");
                        });
    }

    private String normalize(String value) {
        return Normalizer.normalize(value.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
    }

    private String cleanName(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private AllergenView view(Allergen value) {
        return new AllergenView(value.getId(), value.getName());
    }

    private AdminAllergenView adminView(Allergen value) {
        return new AdminAllergenView(
                value.getId(), value.getName(), allergens.countDishesByAllergenId(value.getId()));
    }

    private DishAllergensView allergensView(Dish dish) {
        var values =
                dish.getAllergens().stream()
                        .sorted(java.util.Comparator.comparing(Allergen::getName))
                        .map(this::view)
                        .toList();
        return new DishAllergensView(dish.getId(), dish.getName(), values, values.size());
    }

    private DishView view(Dish value) {
        return view(value, dishes.countMenusByDishId(value.getId()));
    }

    private DishView view(Dish value, long menuCount) {
        return new DishView(
                value.getId(),
                value.getName(),
                value.getDescription(),
                value.getType(),
                value.isActive(),
                value.getAllergens().stream().map(this::view).toList(),
                menuCount);
    }

    private HoursView view(OpeningHours value) {
        return new HoursView(
                value.getId(),
                value.getDayOfWeek(),
                value.getOpeningTime(),
                value.getClosingTime(),
                value.isClosed(),
                value.getDisplayOrder());
    }
}
