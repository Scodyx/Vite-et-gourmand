package fr.vitegourmand.catalog.dto;
import fr.vitegourmand.dish.entity.DishType;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;
public final class CatalogDtos {
 private CatalogDtos(){}
 public record AllergenView(Long id,String name){}
 public record AllergenInput(@NotBlank @Size(max=100) String name){}
 public record DishView(Long id,String name,String description,DishType type,boolean active,List<AllergenView> allergens,long menuCount){}
 public record DishInput(@NotBlank @Size(max=160) String name,@Size(max=2000) String description,
  @NotNull DishType type,boolean active){}
 public record HoursView(Long id,DayOfWeek dayOfWeek,LocalTime openingTime,LocalTime closingTime,boolean closed,int displayOrder){}
 public record HoursInput(@NotNull DayOfWeek dayOfWeek,LocalTime openingTime,LocalTime closingTime,boolean closed,@Min(1) @Max(7) int displayOrder){}
}
