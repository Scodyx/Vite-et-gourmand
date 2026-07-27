package fr.vitegourmand.order.service;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.*;
import fr.vitegourmand.common.exception.BusinessException;

class OrderPricingServiceTest {
    private final OrderPricingService service = new OrderPricingService();
    @Test void calculatesBasePrice() {
        var result = service.calculate(new BigDecimal("200"), 10, 10, false, BigDecimal.ZERO);
        assertThat(result.totalAmount()).isEqualByComparingTo("200.00");
    }
    @Test void appliesTenPercentDiscountFromFiveExtraGuests() {
        var result = service.calculate(new BigDecimal("200"), 10, 15, false, BigDecimal.ZERO);
        assertThat(result.menuAmount()).isEqualByComparingTo("300.00");
        assertThat(result.discountAmount()).isEqualByComparingTo("30.00");
        assertThat(result.totalAmount()).isEqualByComparingTo("270.00");
    }
    @Test void calculatesOutsideBordeauxDelivery() {
        var result = service.calculate(new BigDecimal("200"), 10, 10, true, new BigDecimal("10"));
        assertThat(result.deliveryAmount()).isEqualByComparingTo("10.90");
    }
    @Test void rejectsGuestCountBelowMinimum() {
        assertThatThrownBy(() -> service.calculate(new BigDecimal("200"), 10, 9, false, BigDecimal.ZERO))
                .isInstanceOf(BusinessException.class);
    }
    @Test void negativeDistanceIsRejected() {
        assertThatThrownBy(() -> service.calculate(new BigDecimal("100"), 10, 10, true, new BigDecimal("-1")))
                .isInstanceOf(BusinessException.class);
    }
}
