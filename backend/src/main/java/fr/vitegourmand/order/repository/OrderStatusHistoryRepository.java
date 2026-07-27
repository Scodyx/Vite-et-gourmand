package fr.vitegourmand.order.repository;
import fr.vitegourmand.order.entity.OrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory,Long>{
 List<OrderStatusHistory> findByOrderIdOrderByChangedAtAsc(Long orderId);
}
