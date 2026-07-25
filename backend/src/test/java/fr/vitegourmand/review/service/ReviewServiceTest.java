package fr.vitegourmand.review.service;
import fr.vitegourmand.common.exception.BusinessException;
import fr.vitegourmand.order.entity.*;
import fr.vitegourmand.order.repository.CustomerOrderRepository;
import fr.vitegourmand.review.dto.ReviewDtos.Create;
import fr.vitegourmand.review.entity.ModerationStatus;
import fr.vitegourmand.review.entity.Review;
import fr.vitegourmand.review.repository.ReviewRepository;
import fr.vitegourmand.menu.entity.Menu;
import fr.vitegourmand.user.entity.User;
import fr.vitegourmand.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
class ReviewServiceTest {
 @Test void reviewIsRejectedBeforeOrderCompletion(){
  var reviews=mock(ReviewRepository.class);var orders=mock(CustomerOrderRepository.class);var users=mock(UserRepository.class);
  var order=new CustomerOrder();order.setStatus(OrderStatus.DELIVERED);
  when(orders.findByIdAndCustomerEmailIgnoreCase(4L,"client@example.test")).thenReturn(Optional.of(order));
  var service=new ReviewService(reviews,orders,users);
  assertThatThrownBy(()->service.create("client@example.test",4L,new Create(5,"Une excellente prestation")))
   .isInstanceOf(BusinessException.class);verifyNoInteractions(reviews);
 }
 @Test void completedOwnedOrderCreatesOnePendingReview(){
  var reviews=mock(ReviewRepository.class);var orders=mock(CustomerOrderRepository.class);
  var order=completedOrder();when(orders.findByIdAndCustomerEmailIgnoreCase(4L,"client@example.test")).thenReturn(Optional.of(order));
  when(reviews.save(any())).thenAnswer(invocation->invocation.getArgument(0));
  var service=new ReviewService(reviews,orders,mock(UserRepository.class));
  var result=service.create("client@example.test",4L,new Create(5,"Une excellente prestation"));
  assertThat(result.status()).isEqualTo(ModerationStatus.PENDING);assertThat(result.rating()).isEqualTo(5);
  verify(reviews).existsByOrderId(4L);verify(reviews).save(any(Review.class));
 }
 @Test void duplicateReviewIsRejected(){
  var reviews=mock(ReviewRepository.class);var orders=mock(CustomerOrderRepository.class);
  when(orders.findByIdAndCustomerEmailIgnoreCase(4L,"client@example.test")).thenReturn(Optional.of(completedOrder()));
  when(reviews.existsByOrderId(4L)).thenReturn(true);
  var service=new ReviewService(reviews,orders,mock(UserRepository.class));
  assertThatThrownBy(()->service.create("client@example.test",4L,new Create(4,"Prestation très satisfaisante")))
   .isInstanceOf(BusinessException.class);verify(reviews,never()).save(any());
 }
 @Test void publicListQueriesApprovedReviewsOnly(){
  var reviews=mock(ReviewRepository.class);
  when(reviews.findByModerationStatusOrderByCreatedAtDesc(ModerationStatus.APPROVED)).thenReturn(java.util.List.of());
  assertThat(new ReviewService(reviews,mock(CustomerOrderRepository.class),mock(UserRepository.class)).publicApproved()).isEmpty();
  verify(reviews).findByModerationStatusOrderByCreatedAtDesc(ModerationStatus.APPROVED);
 }
 private CustomerOrder completedOrder(){
  var customer=new User();customer.setFirstName("Client");
  var menu=new Menu();ReflectionTestUtils.setField(menu,"id",1L);menu.setTitle("Menu Test");
  var order=new CustomerOrder();ReflectionTestUtils.setField(order,"id",4L);order.setCustomer(customer);order.setMenu(menu);order.setStatus(OrderStatus.COMPLETED);
  return order;
 }
}
