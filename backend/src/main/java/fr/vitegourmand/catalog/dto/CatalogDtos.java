package fr.vitegourmand.catalog.dto;

import fr.vitegourmand.dish.entity.DishType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

public final class CatalogDtos {
    private CatalogDtos() {}

    public record AllergenView(Long id, String name) {}

    public record AdminAllergenView(Long id, String name, long dishCount) {}

    public record AllergenInput(@NotBlank @Size(max = 100) String name) {}

    public record DishAllergensView(
            Long dishId, String dishName, List<AllergenView> allergens, int allergenCount) {}

    public record AllergenIds(@NotNull List<@NotNull Long> allergenIds) {}

    public record DishView(
            Long id,
            String name,
            String description,
            DishType type,
            boolean active,
            List<AllergenView> allergens,
            long menuCount) {}

    public record DishInput(
            @NotBlank @Size(max = 160) String name,
            @Size(max = 2000) String description,
            @NotNull DishType type,
            boolean active) {}

    public record HoursView(
            Long id,
            DayOfWeek dayOfWeek,
            LocalTime openingTime,
            LocalTime closingTime,
            boolean closed,
            int displayOrder) {}

    public record HoursInput(
            @NotNull DayOfWeek dayOfWeek,
            LocalTime openingTime,
            LocalTime closingTime,
            boolean closed,
            @Min(1) @Max(7) int displayOrder) {}
}
