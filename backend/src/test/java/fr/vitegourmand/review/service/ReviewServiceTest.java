package fr.vitegourmand.review.service;
import fr.vitegourmand.common.exception.BusinessException;
import fr.vitegourmand.order.entity.*;
import fr.vitegourmand.order.repository.CustomerOrderRepository;
import fr.vitegourmand.review.dto.ReviewDtos.Create;
import fr.vitegourmand.review.repository.ReviewRepository;
import fr.vitegourmand.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
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
}
