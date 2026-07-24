package fr.vitegourmand.catalog.service;
import fr.vitegourmand.allergen.entity.Allergen;
import fr.vitegourmand.allergen.repository.AllergenRepository;
import fr.vitegourmand.catalog.dto.CatalogDtos.*;
import fr.vitegourmand.common.exception.*;
import fr.vitegourmand.dish.entity.Dish;
import fr.vitegourmand.dish.repository.DishRepository;
import fr.vitegourmand.openinghours.entity.OpeningHours;
import fr.vitegourmand.openinghours.repository.OpeningHoursRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.text.Normalizer;
import java.util.*;
@Service
public class CatalogManagementService {
 private final DishRepository dishes;private final AllergenRepository allergens;private final OpeningHoursRepository hours;
 public CatalogManagementService(DishRepository d,AllergenRepository a,OpeningHoursRepository h){dishes=d;allergens=a;hours=h;}
 @Transactional(readOnly=true) public List<AllergenView> allergens(){return allergens.findAll().stream().map(this::view).toList();}
 @Transactional public AllergenView createAllergen(AllergenInput r){ensureUnique(r.name(),null);var a=new Allergen();a.setName(r.name().trim());return view(allergens.save(a));}
 @Transactional public AllergenView updateAllergen(Long id,AllergenInput r){var a=allergens.findById(id).orElseThrow(()->new NotFoundException("Allergène introuvable"));ensureUnique(r.name(),id);a.setName(r.name().trim());return view(a);}
 @Transactional(readOnly=true) public List<DishView> dishes(){return dishes.findAll().stream().map(this::view).toList();}
 @Transactional public DishView createDish(DishInput r){var d=new Dish();apply(d,r);return view(dishes.save(d));}
 @Transactional public DishView updateDish(Long id,DishInput r){var d=dishes.findById(id).orElseThrow(()->new NotFoundException("Plat introuvable"));apply(d,r);return view(d);}
 @Transactional public void disableDish(Long id){dishes.findById(id).orElseThrow(()->new NotFoundException("Plat introuvable")).setActive(false);}
 @Transactional(readOnly=true) public List<HoursView> hours(){return hours.findAllByOrderByDisplayOrderAsc().stream().map(this::view).toList();}
 @Transactional public HoursView updateHours(Long id,HoursInput r){validate(r);var h=hours.findById(id).orElseThrow(()->new NotFoundException("Horaire introuvable"));
  hours.findByDayOfWeek(r.dayOfWeek()).filter(x->!x.getId().equals(id)).ifPresent(x->{throw new BusinessException("Ce jour existe déjà");});
  h.setDayOfWeek(r.dayOfWeek());h.setClosed(r.closed());h.setOpeningTime(r.closed()?null:r.openingTime());h.setClosingTime(r.closed()?null:r.closingTime());h.setDisplayOrder(r.displayOrder());return view(h);}
 private void apply(Dish d,DishInput r){d.setName(r.name().trim());d.setDescription(r.description()==null?null:r.description().trim());d.setType(r.type());d.setActive(r.active());
  var ids=r.allergenIds()==null?Set.<Long>of():r.allergenIds();var found=allergens.findAllById(ids);if(found.size()!=ids.size())throw new NotFoundException("Un allergène est introuvable");d.setAllergens(new HashSet<>(found));}
 private void validate(HoursInput r){if(!r.closed()&&(r.openingTime()==null||r.closingTime()==null||!r.openingTime().isBefore(r.closingTime())))throw new BusinessException("Les heures d'ouverture doivent précéder la fermeture");}
 private void ensureUnique(String name,Long id){String n=normalize(name);allergens.findAll().stream().filter(a->normalize(a.getName()).equals(n)&&!a.getId().equals(id)).findAny().ifPresent(a->{throw new BusinessException("Cet allergène existe déjà");});}
 private String normalize(String s){return Normalizer.normalize(s.trim().toLowerCase(Locale.ROOT),Normalizer.Form.NFD).replaceAll("\\p{M}","");}
 private AllergenView view(Allergen a){return new AllergenView(a.getId(),a.getName());}
 private DishView view(Dish d){return new DishView(d.getId(),d.getName(),d.getDescription(),d.getType(),d.isActive(),d.getAllergens().stream().map(this::view).toList());}
 private HoursView view(OpeningHours h){return new HoursView(h.getId(),h.getDayOfWeek(),h.getOpeningTime(),h.getClosingTime(),h.isClosed(),h.getDisplayOrder());}
}
