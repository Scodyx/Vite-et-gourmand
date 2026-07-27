package fr.vitegourmand.order.controller;
import fr.vitegourmand.order.dto.OrderDtos.*;
import fr.vitegourmand.order.service.OrderService;
import fr.vitegourmand.order.entity.OrderStatus;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;
import fr.vitegourmand.common.exception.InvalidRequestException;
@RestController
public class OrderController {
 private final OrderService service; public OrderController(OrderService s){service=s;}
 @PostMapping("/api/v1/orders") ResponseEntity<View> create(Authentication a,@Valid @RequestBody Create r){
  return ResponseEntity.status(HttpStatus.CREATED).body(service.create(a.getName(),r));}
 @GetMapping("/api/v1/orders") Page<View> mine(Authentication a,@PageableDefault(size=20) Pageable p){return service.mine(a.getName(),p);}
 @GetMapping("/api/v1/users/me/orders") Page<View> mineAlias(Authentication a,@PageableDefault(size=20) Pageable p){return service.mine(a.getName(),p);}
 @GetMapping("/api/v1/users/me/orders/{id}") Detail mineDetail(Authentication a,@PathVariable Long id){return service.mineDetail(a.getName(),id);}
 @PutMapping("/api/v1/users/me/orders/{id}") View update(Authentication a,@PathVariable Long id,@Valid @RequestBody Update r){
  return service.updateMine(a.getName(),id,r);}
 @PostMapping("/api/v1/orders/{id}/cancel") View cancel(Authentication a,@PathVariable Long id,@Valid @RequestBody Cancellation r){
  return service.cancelMine(a.getName(),id,r);}
 @PatchMapping("/api/v1/users/me/orders/{id}/cancel") View cancelAlias(Authentication a,@PathVariable Long id,@Valid @RequestBody Cancellation r){
  return service.cancelMine(a.getName(),id,r);}
 @GetMapping("/api/v1/employee/orders") EmployeePage all(
  @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size,
  @RequestParam(defaultValue="serviceDate") String sort,@RequestParam(defaultValue="desc") String direction,
  @RequestParam(required=false) String status,
  @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) java.time.LocalDate dateFrom,
  @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) java.time.LocalDate dateTo,
  @RequestParam(required=false) String search,@RequestParam(defaultValue="false") boolean today,
  @RequestParam(defaultValue="false") boolean upcoming){
  OrderStatus parsedStatus=null;
  if(status!=null&&!status.isBlank())try{parsedStatus=OrderStatus.valueOf(status);}
  catch(IllegalArgumentException exception){throw new InvalidRequestException("Statut inconnu");}
  return service.all(new EmployeeQuery(page,size,sort,direction,parsedStatus,dateFrom,dateTo,search,today,upcoming));
 }
 @GetMapping("/api/v1/employee/orders/{id}") EmployeeDetail detail(@PathVariable Long id){return service.employeeDetail(id);}
 @PatchMapping("/api/v1/employee/orders/{id}/status") View transition(Authentication a,@PathVariable Long id,@Valid @RequestBody Transition r){
  return service.transition(a.getName(),id,r);}
 @PatchMapping("/api/v1/employee/orders/{id}/cancel") View employeeCancel(Authentication a,@PathVariable Long id,@Valid @RequestBody Cancellation r){
  return service.cancelEmployee(a.getName(),id,r);}
}
