package fr.vitegourmand.order.service;
import fr.vitegourmand.common.exception.*;
import fr.vitegourmand.menu.repository.MenuRepository;
import fr.vitegourmand.order.dto.OrderDtos.*;
import fr.vitegourmand.order.entity.*;
import fr.vitegourmand.order.repository.*;
import fr.vitegourmand.review.repository.ReviewRepository;
import fr.vitegourmand.user.entity.User;
import fr.vitegourmand.user.entity.Role;
import fr.vitegourmand.user.repository.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.UUID;
import java.util.Map;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;
import fr.vitegourmand.common.exception.InvalidRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import fr.vitegourmand.common.email.ApplicationEmailService;

@Service
public class OrderService {
 private final CustomerOrderRepository orders; private final OrderStatusHistoryRepository history;
 private final MenuRepository menus; private final UserRepository users; private final OrderPricingService pricing;
 private final OrderStatusService statuses;
 private final ReviewRepository reviews;
 @Autowired(required=false) private ApplicationEmailService emails;
 public OrderService(CustomerOrderRepository o,OrderStatusHistoryRepository h,MenuRepository m,UserRepository u,
  OrderPricingService p,OrderStatusService s,ReviewRepository r){orders=o;history=h;menus=m;users=u;pricing=p;statuses=s;reviews=r;}
 @Transactional
 public View create(String email,Create r){
  User customer=user(email); var menu=menus.findLockedById(r.menuId()).filter(m->m.isActive())
   .orElseThrow(()->new NotFoundException("Menu introuvable"));
  if(menu.getAvailableStock()<r.personCount()) throw new BusinessException("Stock insuffisant pour ce nombre de personnes");
  var outside=!normalize(r.deliveryCity()).equals("bordeaux");
  var price=pricing.calculate(menu.getBasePrice(),menu.getMinimumPersons(),r.personCount(),outside,r.distanceKm());
  var o=new CustomerOrder(); o.setOrderNumber("VG-"+LocalDate.now().getYear()+"-"+UUID.randomUUID().toString().substring(0,8).toUpperCase());
  o.setCustomer(customer);o.setMenu(menu);o.setPersonCount(r.personCount());o.setPrestationDate(r.prestationDate());
  o.setDesiredDeliveryTime(r.desiredDeliveryTime());o.setDeliveryAddress(r.deliveryAddress().trim());
  o.setDeliveryPostalCode(r.deliveryPostalCode().trim());o.setDeliveryCity(r.deliveryCity().trim());
  o.setDeliveryCountry(r.deliveryCountry().trim());o.setDistanceKm(outside?r.distanceKm():java.math.BigDecimal.ZERO);o.setOutsideBordeaux(outside);
  o.setMenuAmount(price.menuAmount());o.setDiscountAmount(price.discountAmount());o.setDeliveryAmount(price.deliveryAmount());
  o.setTotalAmount(price.totalAmount());o.setEquipmentLoaned(r.equipmentLoaned());o.setStatus(OrderStatus.PENDING);
  menu.setAvailableStock(menu.getAvailableStock()-r.personCount());menu.touch();orders.save(o);
  history.save(OrderStatusHistory.of(o,null,OrderStatus.PENDING,customer,"Commande créée"));
  if(emails!=null)emails.orderConfirmation(customer.getEmail(),o.getOrderNumber());
  return View.from(o);
 }
 @Transactional(readOnly=true) public Page<View> mine(String email,Pageable p){return orders.findByCustomerEmailIgnoreCaseOrderByCreatedAtDesc(email,p).map(View::from);}
 private static final Map<String,String> EMPLOYEE_SORTS=Map.of("createdAt","createdAt","serviceDate","prestationDate",
  "totalAmount","totalAmount","status","status","orderNumber","orderNumber");
 @Transactional(readOnly=true) public EmployeePage all(EmployeeQuery query){
  if(query.page()<0)badRequest("La page doit être positive");
  if(query.size()<1)badRequest("La taille doit être positive");
  int size=Math.min(query.size(),100);
  String property=EMPLOYEE_SORTS.get(query.sort());
  if(property==null)badRequest("Champ de tri interdit");
  Sort.Direction direction;
  try{direction=Sort.Direction.fromString(query.direction());}
  catch(IllegalArgumentException exception){badRequest("Direction de tri invalide");return null;}
  if(query.dateFrom()!=null&&query.dateTo()!=null&&query.dateFrom().isAfter(query.dateTo()))
   badRequest("La date de début doit précéder la date de fin");
  if(query.today()&&query.upcoming())badRequest("Les filtres today et upcoming sont incompatibles");
  var pageable=PageRequest.of(query.page(),size,Sort.by(direction,property));
  return EmployeePage.from(orders.findAll(employeeSpecification(query),pageable).map(EmployeeView::from));
 }
 @Transactional(readOnly=true) public Detail mineDetail(String email,Long id){return detail(orders.findByIdAndCustomerEmailIgnoreCase(id,email)
  .orElseThrow(()->new NotFoundException("Commande introuvable")));}
 @Transactional(readOnly=true) public EmployeeDetail employeeDetail(Long id){
  var order=orders.findById(id).orElseThrow(()->new NotFoundException("Commande introuvable"));
  return new EmployeeDetail(EmployeeView.from(order),history(order));
 }
 @Transactional public View cancelMine(String email,Long id,Cancellation r){
  var o=orders.findLockedById(id).orElseThrow(()->new NotFoundException("Commande introuvable")); var actor=user(email);
  if(!o.getCustomer().getId().equals(actor.getId())) throw new NotFoundException("Commande introuvable");
  statuses.validate(o.getStatus(),OrderStatus.CANCELLED);var before=o.getStatus();o.cancel(r.reason(),r.contactMode(),actor);
  o.getMenu().setAvailableStock(o.getMenu().getAvailableStock()+o.getPersonCount());history.save(OrderStatusHistory.of(o,before,o.getStatus(),actor,r.reason()));
  if(emails!=null)emails.cancellation(o.getCustomer().getEmail(),o.getOrderNumber());
  return View.from(o);
 }
 @Transactional public View updateMine(String email,Long id,Update r){
  var o=orders.findLockedById(id).orElseThrow(()->new NotFoundException("Commande introuvable"));var actor=user(email);
  if(!o.getCustomer().getId().equals(actor.getId()))throw new NotFoundException("Commande introuvable");
  if(o.getStatus()!=OrderStatus.PENDING)throw new BusinessException("Seule une commande en attente peut être modifiée");
  var menu=menus.findLockedById(o.getMenu().getId()).orElseThrow(()->new NotFoundException("Menu introuvable"));
  int difference=r.personCount()-o.getPersonCount();
  if(difference>0&&menu.getAvailableStock()<difference)throw new BusinessException("Stock insuffisant pour cette modification");
  var outside=!normalize(r.deliveryCity()).equals("bordeaux");
  var price=pricing.calculate(menu.getBasePrice(),menu.getMinimumPersons(),r.personCount(),outside,r.distanceKm());
  menu.setAvailableStock(menu.getAvailableStock()-difference);menu.touch();o.setPersonCount(r.personCount());o.setPrestationDate(r.prestationDate());
  o.setDesiredDeliveryTime(r.desiredDeliveryTime());o.setDeliveryAddress(r.deliveryAddress().trim());o.setDeliveryPostalCode(r.deliveryPostalCode().trim());
  o.setDeliveryCity(r.deliveryCity().trim());o.setDeliveryCountry(r.deliveryCountry().trim());o.setOutsideBordeaux(outside);o.setDistanceKm(outside?r.distanceKm():java.math.BigDecimal.ZERO);
  o.setMenuAmount(price.menuAmount());o.setDiscountAmount(price.discountAmount());o.setDeliveryAmount(price.deliveryAmount());o.setTotalAmount(price.totalAmount());
  history.save(OrderStatusHistory.of(o,OrderStatus.PENDING,OrderStatus.PENDING,actor,"Commande modifiée"));return View.from(o);
 }
 @Transactional public View transition(String email,Long id,Transition r){
  var o=orders.findLockedById(id).orElseThrow(()->new NotFoundException("Commande introuvable"));var actor=user(email);
  var before=o.getStatus();statuses.validate(before,r.status());o.setStatus(r.status());
  if(before==OrderStatus.DELIVERED&&o.isEquipmentLoaned()&&r.status()!=OrderStatus.WAITING_FOR_EQUIPMENT_RETURN)
   throw new BusinessException("Le retour du matériel doit être attendu");
  if(before==OrderStatus.DELIVERED&&!o.isEquipmentLoaned()&&r.status()!=OrderStatus.COMPLETED)
   throw new BusinessException("La commande doit être terminée sans matériel prêté");
  history.save(OrderStatusHistory.of(o,before,r.status(),actor,r.comment()));
  if(emails!=null&&r.status()==OrderStatus.WAITING_FOR_EQUIPMENT_RETURN)emails.equipmentReturn(o.getCustomer().getEmail(),o.getOrderNumber());
  if(emails!=null&&r.status()==OrderStatus.COMPLETED)emails.reviewInvitation(o.getCustomer().getEmail(),o.getOrderNumber());
  return View.from(o);
 }
 @Transactional public View cancelEmployee(String email,Long id,Cancellation r){
  var o=orders.findLockedById(id).orElseThrow(()->new NotFoundException("Commande introuvable"));var actor=user(email);
  var before=o.getStatus();statuses.validate(before,OrderStatus.CANCELLED);o.cancel(r.reason(),r.contactMode(),actor);
  o.getMenu().setAvailableStock(o.getMenu().getAvailableStock()+o.getPersonCount());
  history.save(OrderStatusHistory.of(o,before,OrderStatus.CANCELLED,actor,r.reason()));
  if(emails!=null)emails.cancellation(o.getCustomer().getEmail(),o.getOrderNumber());return View.from(o);
 }
 private String normalize(String value){return java.text.Normalizer.normalize(value.trim().toLowerCase(java.util.Locale.ROOT),java.text.Normalizer.Form.NFD).replaceAll("\\p{M}","").replaceAll("\\s+"," ");}
 private User user(String email){return users.findByEmailIgnoreCase(email).filter(User::isEnabled)
  .orElseThrow(()->new NotFoundException("Utilisateur introuvable"));}
 private Specification<CustomerOrder> employeeSpecification(EmployeeQuery query){
  return (root,cq,cb)->{
   var predicates=new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
   if(query.status()!=null)predicates.add(cb.equal(root.get("status"),query.status()));
   if(query.dateFrom()!=null)predicates.add(cb.greaterThanOrEqualTo(root.get("prestationDate"),query.dateFrom()));
   if(query.dateTo()!=null)predicates.add(cb.lessThanOrEqualTo(root.get("prestationDate"),query.dateTo()));
   var localToday=LocalDate.now(ZoneId.of("Europe/Paris"));
   if(query.today())predicates.add(cb.equal(root.get("prestationDate"),localToday));
   if(query.upcoming())predicates.add(cb.greaterThan(root.get("prestationDate"),localToday));
   if(query.search()!=null&&!query.search().isBlank()){
    var customer=root.join("customer",JoinType.INNER);
    String pattern="%"+query.search().trim().toLowerCase(java.util.Locale.ROOT)+"%";
    predicates.add(cb.or(cb.like(cb.lower(root.get("orderNumber")),pattern),
     cb.like(cb.lower(customer.get("firstName")),pattern),cb.like(cb.lower(customer.get("lastName")),pattern),
     cb.like(cb.lower(customer.get("email")),pattern)));
   }
   return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
  };
 }
 private void badRequest(String message){throw new InvalidRequestException(message);}
 private Detail detail(CustomerOrder o){return new Detail(View.from(o),history(o),reviews.existsByOrderId(o.getId()));}
 private java.util.List<History> history(CustomerOrder o){return history.findByOrderIdOrderByChangedAtAsc(o.getId()).stream()
  .map(h->new History(h.getPreviousStatus(),h.getNewStatus(),h.getChangedAt(),actorLabel(h.getChangedBy()),h.getComment())).toList();
 }
 private String actorLabel(User actor){if(actor==null)return null;return actor.getRole()==Role.USER?"Client":"Équipe Vite & Gourmand";}
}
