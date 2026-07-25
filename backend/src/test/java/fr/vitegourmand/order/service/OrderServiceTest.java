package fr.vitegourmand.order.service;
import fr.vitegourmand.common.exception.BusinessException;
import fr.vitegourmand.menu.entity.Menu;
import fr.vitegourmand.menu.repository.MenuRepository;
import fr.vitegourmand.order.dto.OrderDtos.Create;
import fr.vitegourmand.order.dto.OrderDtos.Cancellation;
import fr.vitegourmand.order.dto.OrderDtos.Update;
import fr.vitegourmand.order.entity.CancellationContactMode;
import fr.vitegourmand.order.entity.CustomerOrder;
import fr.vitegourmand.order.entity.OrderStatus;
import fr.vitegourmand.order.repository.*;
import fr.vitegourmand.review.repository.ReviewRepository;
import fr.vitegourmand.user.entity.User;
import fr.vitegourmand.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.test.util.ReflectionTestUtils;
import java.math.BigDecimal;
import java.time.*;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
class OrderServiceTest {
 private CustomerOrderRepository orders;private OrderStatusHistoryRepository history;private MenuRepository menus;
 private UserRepository users;private ReviewRepository reviews;private OrderService service;private Menu menu;private User user;
 @BeforeEach void setup(){
  orders=mock(CustomerOrderRepository.class);history=mock(OrderStatusHistoryRepository.class);menus=mock(MenuRepository.class);users=mock(UserRepository.class);
  reviews=mock(ReviewRepository.class);
  service=new OrderService(orders,history,menus,users,new OrderPricingService(),new OrderStatusService(),reviews);
  menu=new Menu();menu.setTitle("Test");menu.setSlug("test");menu.setDescription("Description");menu.setConditions("Conditions");
  menu.setMinimumPersons(10);menu.setBasePrice(new BigDecimal("100"));menu.setAvailableStock(30);menu.setActive(true);menu.setTheme("Test");menu.setDiet("Test");
  ReflectionTestUtils.setField(menu,"id",1L);
  user=new User();ReflectionTestUtils.setField(user,"id",7L);user.setEmail("client@example.test");user.setFirstName("Client");user.setLastName("Test");user.setPasswordHash("hash");
  when(users.findByEmailIgnoreCase("client@example.test")).thenReturn(Optional.of(user));when(menus.findLockedById(1L)).thenReturn(Optional.of(menu));
 }
 @Test void creationDecrementsStockByPersonCount(){
  service.create("client@example.test",request(12));assertThat(menu.getAvailableStock()).isEqualTo(18);verify(orders).save(any());verify(history).save(any());
 }
 @Test void insufficientStockDoesNotPersistAnything(){
  menu.setAvailableStock(11);assertThatThrownBy(()->service.create("client@example.test",request(12))).isInstanceOf(BusinessException.class);
  assertThat(menu.getAvailableStock()).isEqualTo(11);verifyNoInteractions(orders,history);
 }
 @Test void inactiveMenuIsRejectedWithoutChangingStock(){
  menu.setActive(false);
  assertThatThrownBy(()->service.create("client@example.test",request(10)))
   .isInstanceOf(fr.vitegourmand.common.exception.NotFoundException.class);
  assertThat(menu.getAvailableStock()).isEqualTo(30);verifyNoInteractions(orders,history);
 }
 @Test void pendingUpdateAppliesOnlyTheStockDifference(){
  var order=order(10,OrderStatus.PENDING);when(orders.findLockedById(9L)).thenReturn(Optional.of(order));
  service.updateMine("client@example.test",9L,update(14));
  assertThat(order.getPersonCount()).isEqualTo(14);assertThat(menu.getAvailableStock()).isEqualTo(26);verify(history).save(any());
 }
 @Test void nonPendingOrderCannotBeUpdated(){
  var order=order(10,OrderStatus.ACCEPTED);when(orders.findLockedById(9L)).thenReturn(Optional.of(order));
  assertThatThrownBy(()->service.updateMine("client@example.test",9L,update(12))).isInstanceOf(BusinessException.class);
  assertThat(menu.getAvailableStock()).isEqualTo(30);verifyNoInteractions(history);
 }
 @Test void cancellationRestoresStockOnlyOnce(){
  var order=order(10,OrderStatus.PENDING);when(orders.findLockedById(9L)).thenReturn(Optional.of(order));
  var cancellation=new Cancellation("Annulation demandée par le client",CancellationContactMode.CLIENT_EMAIL);
  service.cancelMine("client@example.test",9L,cancellation);
  assertThat(menu.getAvailableStock()).isEqualTo(40);
  assertThatThrownBy(()->service.cancelMine("client@example.test",9L,cancellation)).isInstanceOf(BusinessException.class);
  assertThat(menu.getAvailableStock()).isEqualTo(40);
 }
 @Test void anotherUserCannotUpdateAnOrder(){
  var owner=new User();ReflectionTestUtils.setField(owner,"id",99L);
  var order=order(10,OrderStatus.PENDING);order.setCustomer(owner);when(orders.findLockedById(9L)).thenReturn(Optional.of(order));
  assertThatThrownBy(()->service.updateMine("client@example.test",9L,update(12)))
   .isInstanceOf(fr.vitegourmand.common.exception.NotFoundException.class);
  assertThat(menu.getAvailableStock()).isEqualTo(30);
 }
 @Test void detailUsesTheAuthenticatedOwnerQueryAndIncludesReviewState(){
  var order=order(10,OrderStatus.COMPLETED);
  when(orders.findByIdAndCustomerEmailIgnoreCase(9L,"client@example.test")).thenReturn(Optional.of(order));
  when(history.findByOrderIdOrderByChangedAtAsc(9L)).thenReturn(java.util.List.of());
  when(reviews.existsByOrderId(9L)).thenReturn(true);
  var detail=service.mineDetail("client@example.test",9L);
  assertThat(detail.order().orderNumber()).isEqualTo("VG-TEST");assertThat(detail.reviewSubmitted()).isTrue();
  verify(orders).findByIdAndCustomerEmailIgnoreCase(9L,"client@example.test");
 }
 @Test void detailOfAnotherUsersOrderIsNotExposed(){
  when(orders.findByIdAndCustomerEmailIgnoreCase(9L,"client@example.test")).thenReturn(Optional.empty());
  assertThatThrownBy(()->service.mineDetail("client@example.test",9L))
   .isInstanceOf(fr.vitegourmand.common.exception.NotFoundException.class);
  verifyNoInteractions(history,reviews);
 }
 private CustomerOrder order(int count,OrderStatus status){
  var order=new CustomerOrder();ReflectionTestUtils.setField(order,"id",9L);order.setCustomer(user);order.setMenu(menu);
  order.setPersonCount(count);order.setStatus(status);order.setOrderNumber("VG-TEST");order.setPrestationDate(LocalDate.now().plusDays(5));
  order.setDesiredDeliveryTime(LocalTime.NOON);order.setDeliveryAddress("1 rue Test");order.setDeliveryPostalCode("33000");
  order.setDeliveryCity("Bordeaux");order.setDeliveryCountry("France");order.setDistanceKm(BigDecimal.ZERO);
  order.setMenuAmount(new BigDecimal("100"));order.setDiscountAmount(BigDecimal.ZERO);order.setDeliveryAmount(BigDecimal.ZERO);order.setTotalAmount(new BigDecimal("100"));
  return order;
 }
 private Update update(int count){return new Update(count,LocalDate.now().plusDays(6),LocalTime.NOON,"2 rue Test","33000","Bordeaux","France",BigDecimal.ZERO);}
 private Create request(int count){return new Create(1L,count,LocalDate.now().plusDays(5),LocalTime.NOON,"1 rue Test","33000","Bordeaux","France",BigDecimal.ZERO,false,false);}
}
