package fr.vitegourmand.menu.controller;
import fr.vitegourmand.common.exception.*;
import fr.vitegourmand.menu.entity.Menu;
import fr.vitegourmand.menu.repository.MenuRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.*;
@RestController @RequestMapping("/api/v1/employee/menus")
public class EmployeeMenuController {
 private final MenuRepository menus;public EmployeeMenuController(MenuRepository m){menus=m;}
 public record Input(@NotBlank String title,@NotBlank @Pattern(regexp="[a-z0-9-]+") String slug,
  @NotBlank String description,@NotBlank String conditions,@Min(1) int minimumPersons,
  @NotNull @DecimalMin("0") BigDecimal basePrice,@Min(0) int availableStock,boolean active,
  @NotBlank String theme,@NotBlank String diet){}
 public record View(Long id,String title,String slug,String description,String conditions,int minimumPersons,
  BigDecimal basePrice,int availableStock,boolean active,String theme,String diet){}
 @GetMapping List<View> all(){return menus.findAll().stream().map(this::view).toList();}
 @PostMapping @ResponseStatus(HttpStatus.CREATED) @Transactional View create(@Valid @RequestBody Input r){
  if(menus.findBySlug(r.slug()).isPresent())throw new BusinessException("Ce slug existe déjà");
  var m=new Menu();apply(m,r);return view(menus.save(m));}
 @PutMapping("/{id}") @Transactional View update(@PathVariable Long id,@Valid @RequestBody Input r){
  var m=menus.findById(id).orElseThrow(()->new NotFoundException("Menu introuvable"));
  menus.findBySlug(r.slug()).filter(other->!other.getId().equals(id)).ifPresent(other->{throw new BusinessException("Ce slug existe déjà");});
  apply(m,r);return view(m);}
 @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional void disable(@PathVariable Long id){
  var m=menus.findById(id).orElseThrow(()->new NotFoundException("Menu introuvable"));m.setActive(false);m.touch();}
 private void apply(Menu m,Input r){m.setTitle(r.title().trim());m.setSlug(r.slug());m.setDescription(r.description().trim());
  m.setConditions(r.conditions().trim());m.setMinimumPersons(r.minimumPersons());m.setBasePrice(r.basePrice());
  m.setAvailableStock(r.availableStock());m.setActive(r.active());m.setTheme(r.theme().trim());m.setDiet(r.diet().trim());m.touch();}
 private View view(Menu m){return new View(m.getId(),m.getTitle(),m.getSlug(),m.getDescription(),m.getConditions(),m.getMinimumPersons(),
  m.getBasePrice(),m.getAvailableStock(),m.isActive(),m.getTheme(),m.getDiet());}
}
