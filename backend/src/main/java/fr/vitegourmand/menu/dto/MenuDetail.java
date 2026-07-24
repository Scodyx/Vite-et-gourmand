package fr.vitegourmand.menu.dto;
import fr.vitegourmand.dish.entity.DishType;
import java.math.BigDecimal;
import java.util.*;
public record MenuDetail(Long id,String title,String slug,String description,String conditions,String theme,String diet,
 int minimumPersons,BigDecimal basePrice,int availableStock,List<Image> images,List<Dish> dishes){
 public record Image(Long id,String url,String altText,int displayOrder){}
 public record Dish(Long id,String name,String description,DishType type,List<String> allergens){}
}
