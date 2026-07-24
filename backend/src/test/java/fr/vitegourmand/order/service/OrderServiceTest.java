package fr.vitegourmand.order.service;
import fr.vitegourmand.common.exception.BusinessException;
import fr.vitegourmand.menu.entity.Menu;
import fr.vitegourmand.menu.repository.MenuRepository;
import fr.vitegourmand.order.dto.OrderDtos.Create;
import fr.vitegourmand.order.repository.*;
import fr.vitegourmand.user.entity.User;
import fr.vitegourmand.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
class OrderServiceTest {
 private CustomerOrderRepository orders;private OrderStatusHistoryRepository history;private MenuRepository menus;
 private UserRepository users;private OrderService service;private Menu menu;
 @BeforeEach void setup(){
  orders=mock(CustomerOrderRepository.class);history=mock(OrderStatusHistoryRepository.class);menus=mock(MenuRepository.class);users=mock(UserRepository.class);
  service=new OrderService(orders,history,menus,users,new OrderPricingService(),new OrderStatusService());
  menu=new Menu();menu.setTitle("Test");menu.setSlug("test");menu.setDescription("Description");menu.setConditions("Conditions");
  menu.setMinimumPersons(10);menu.setBasePrice(new BigDecimal("100"));menu.setAvailableStock(30);menu.setActive(true);menu.setTheme("Test");menu.setDiet("Test");
  var user=new User();user.setEmail("client@example.test");user.setFirstName("Client");user.setLastName("Test");user.setPasswordHash("hash");
  when(users.findByEmailIgnoreCase("client@example.test")).thenReturn(Optional.of(user));when(menus.findLockedById(1L)).thenReturn(Optional.of(menu));
 }
 @Test void creationDecrementsStockByPersonCount(){
  service.create("client@example.test",request(12));assertThat(menu.getAvailableStock()).isEqualTo(18);verify(orders).save(any());verify(history).save(any());
 }
 @Test void insufficientStockDoesNotPersistAnything(){
  menu.setAvailableStock(11);assertThatThrownBy(()->service.create("client@example.test",request(12))).isInstanceOf(BusinessException.class);
  assertThat(menu.getAvailableStock()).isEqualTo(11);verifyNoInteractions(orders,history);
 }
 private Create request(int count){return new Create(1L,count,LocalDate.now().plusDays(5),LocalTime.NOON,"1 rue Test","33000","Bordeaux","France",BigDecimal.ZERO,false,false);}
}
