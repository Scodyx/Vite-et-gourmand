package fr.vitegourmand.catalog.service;

import fr.vitegourmand.allergen.entity.Allergen;
import fr.vitegourmand.allergen.repository.AllergenRepository;
import fr.vitegourmand.catalog.dto.CatalogDtos.*;
import fr.vitegourmand.common.exception.BusinessException;
import fr.vitegourmand.common.exception.NotFoundException;
import fr.vitegourmand.dish.entity.Dish;
import fr.vitegourmand.dish.entity.DishType;
import fr.vitegourmand.dish.repository.DishRepository;
import fr.vitegourmand.openinghours.repository.OpeningHoursRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CatalogManagementServiceAllergenTest {
 @Mock DishRepository dishes; @Mock AllergenRepository allergens; @Mock OpeningHoursRepository hours;
 CatalogManagementService service;
 @BeforeEach void init(){service=new CatalogManagementService(dishes,allergens,hours);}

 @Test void createsNormalizedAllergenAndRejectsDuplicate(){
  when(allergens.findByNameIgnoreCase("Fruits à coque")).thenReturn(Optional.empty());
  when(allergens.save(any())).thenAnswer(i->{var a=(Allergen)i.getArgument(0);ReflectionTestUtils.setField(a,"id",3L);return a;});
  assertThat(service.createAllergen(new AllergenInput(" Fruits   à coque ")).name()).isEqualTo("Fruits à coque");
  var existing=allergen(4L,"Gluten");when(allergens.findByNameIgnoreCase("Gluten")).thenReturn(Optional.of(existing));
  assertThatThrownBy(()->service.createAllergen(new AllergenInput("Gluten"))).isInstanceOf(BusinessException.class);
 }
 @Test void addsRemovesAndRejectsDuplicateAssociation(){
  var d=dish(8L);var a=allergen(2L,"Gluten");when(dishes.findById(8L)).thenReturn(Optional.of(d));when(allergens.findById(2L)).thenReturn(Optional.of(a));
  assertThat(service.addAllergen(8L,2L).allergenCount()).isEqualTo(1);
  assertThatThrownBy(()->service.addAllergen(8L,2L)).isInstanceOf(BusinessException.class);
  assertThat(service.removeAllergen(8L,2L).allergenCount()).isZero();
  assertThatThrownBy(()->service.removeAllergen(8L,2L)).isInstanceOf(BusinessException.class);
 }
 @Test void replacementIsAtomicWhenAnIdentifierIsUnknown(){
  var d=dish(8L);var original=allergen(1L,"Lait");var replacement=allergen(2L,"Gluten");d.getAllergens().add(original);
  when(dishes.findById(8L)).thenReturn(Optional.of(d));when(allergens.findById(2L)).thenReturn(Optional.of(replacement));when(allergens.findById(404L)).thenReturn(Optional.empty());
  assertThatThrownBy(()->service.replaceAllergens(8L,new AllergenIds(List.of(2L,404L)))).isInstanceOf(NotFoundException.class);
  assertThat(d.getAllergens()).containsExactly(original);
  assertThat(service.replaceAllergens(8L,new AllergenIds(List.of(2L))).allergens()).extracting("id").containsExactly(2L);
 }
 @Test void updatingSimpleFieldsPreservesAssociations(){
  var d=dish(8L);var a=allergen(1L,"Lait");d.getAllergens().add(a);when(dishes.findById(8L)).thenReturn(Optional.of(d));
  when(dishes.findByNameIgnoreCase("Nouveau")).thenReturn(Optional.empty());when(dishes.countMenusByDishId(8L)).thenReturn(0L);
  service.updateDish(8L,new DishInput("Nouveau",null,DishType.ENTRY,true));
  assertThat(d.getAllergens()).containsExactly(a);verify(allergens,never()).deleteById(anyLong());
 }
 private Dish dish(long id){var d=new Dish();ReflectionTestUtils.setField(d,"id",id);d.setName("Plat");d.setType(DishType.ENTRY);d.setActive(true);return d;}
 private Allergen allergen(long id,String name){var a=new Allergen();ReflectionTestUtils.setField(a,"id",id);a.setName(name);return a;}
}
