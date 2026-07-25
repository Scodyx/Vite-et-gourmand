package fr.vitegourmand.statistics.service;

import fr.vitegourmand.menu.entity.Menu;
import fr.vitegourmand.order.entity.CustomerOrder;
import fr.vitegourmand.order.repository.CustomerOrderRepository;
import fr.vitegourmand.statistics.document.MenuStatisticsDocument;
import fr.vitegourmand.statistics.repository.MenuStatisticsRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

class StatisticsServiceTest {
    @Test void rebuildIsRepeatableAndUsesOnlyTheBillableRepositoryQuery() {
        var orders = mock(CustomerOrderRepository.class);
        var statistics = mock(MenuStatisticsRepository.class);
        when(orders.findAllBillable()).thenReturn(List.of(order()));
        when(statistics.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));
        var service = new StatisticsService(orders, statistics);

        var first = service.rebuild();
        var second = service.rebuild();

        assertThat(first).hasSize(1);
        assertThat(second).usingRecursiveComparison().ignoringFields("updatedAt").isEqualTo(first);
        assertThat(first.getFirst().orderCount()).isEqualTo(1);
        assertThat(first.getFirst().totalRevenue()).isEqualByComparingTo("108.00");
        verify(orders, times(2)).findAllBillable();
        verify(statistics, times(2)).deleteAll();
        verify(statistics, times(2)).saveAll(anyList());
    }

    private CustomerOrder order() {
        var menu = new Menu();
        ReflectionTestUtils.setField(menu, "id", 1L);
        menu.setTitle("Menu Test");
        var order = new CustomerOrder();
        order.setMenu(menu);
        order.setPrestationDate(LocalDate.of(2026, 7, 25));
        order.setMenuAmount(new BigDecimal("100.00"));
        order.setDiscountAmount(new BigDecimal("2.00"));
        order.setDeliveryAmount(new BigDecimal("10.00"));
        order.setTotalAmount(new BigDecimal("108.00"));
        return order;
    }
}
