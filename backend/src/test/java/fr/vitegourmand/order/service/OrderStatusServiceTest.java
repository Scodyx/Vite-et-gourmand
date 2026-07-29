package fr.vitegourmand.order.service;

import fr.vitegourmand.common.exception.BusinessException;
import fr.vitegourmand.order.entity.OrderStatus;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class OrderStatusServiceTest {
    private final OrderStatusService service = new OrderStatusService();
    @Test void allowsExpectedTransition() {
        assertThatCode(() -> service.validate(OrderStatus.PENDING, OrderStatus.ACCEPTED)).doesNotThrowAnyException();
    }
    @Test void rejectsSkippedTransition() {
        assertThatThrownBy(() -> service.validate(OrderStatus.PENDING, OrderStatus.COMPLETED))
                .isInstanceOf(BusinessException.class);
    }
}
