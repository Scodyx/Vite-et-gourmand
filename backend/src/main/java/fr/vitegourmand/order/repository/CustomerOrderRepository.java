package fr.vitegourmand.order.repository;
import fr.vitegourmand.order.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.List;
public interface CustomerOrderRepository extends JpaRepository<CustomerOrder,Long>,JpaSpecificationExecutor<CustomerOrder>{
 Page<CustomerOrder> findByCustomerEmailIgnoreCaseOrderByCreatedAtDesc(String email,Pageable pageable);
 Page<CustomerOrder> findAllByOrderByCreatedAtDesc(Pageable pageable);
 Optional<CustomerOrder> findByIdAndCustomerEmailIgnoreCase(Long id,String email);
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select o from CustomerOrder o where o.id=:id")
 Optional<CustomerOrder> findLockedById(Long id);
 @Query("select o from CustomerOrder o join fetch o.menu where o.status <> fr.vitegourmand.order.entity.OrderStatus.CANCELLED")
 List<CustomerOrder> findAllBillable();
}
