package fr.vitegourmand.order.service;

import fr.vitegourmand.common.exception.BusinessException;
import fr.vitegourmand.order.entity.OrderStatus;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class OrderStatusService {
    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED =
            Map.of(
                    OrderStatus.PENDING, Set.of(OrderStatus.ACCEPTED, OrderStatus.CANCELLED),
                    OrderStatus.ACCEPTED, Set.of(OrderStatus.IN_PREPARATION, OrderStatus.CANCELLED),
                    OrderStatus.IN_PREPARATION, Set.of(OrderStatus.OUT_FOR_DELIVERY),
                    OrderStatus.OUT_FOR_DELIVERY, Set.of(OrderStatus.DELIVERED),
                    OrderStatus.DELIVERED,
                            Set.of(OrderStatus.WAITING_FOR_EQUIPMENT_RETURN, OrderStatus.COMPLETED),
                    OrderStatus.WAITING_FOR_EQUIPMENT_RETURN, Set.of(OrderStatus.COMPLETED));

    public void validate(OrderStatus from, OrderStatus to) {
        if (!ALLOWED.getOrDefault(from, Set.of()).contains(to)) {
            throw new BusinessException("Transition de statut interdite : " + from + " vers " + to);
        }
    }
}
