package fr.vitegourmand.order.repository;

import fr.vitegourmand.order.entity.CustomerOrder;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface CustomerOrderRepository
        extends JpaRepository<CustomerOrder, Long>, JpaSpecificationExecutor<CustomerOrder> {
    Page<CustomerOrder> findByCustomerEmailIgnoreCaseOrderByCreatedAtDesc(
            String email, Pageable pageable);

    Page<CustomerOrder> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Optional<CustomerOrder> findByIdAndCustomerEmailIgnoreCase(Long id, String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from CustomerOrder o where o.id=:id")
    Optional<CustomerOrder> findLockedById(Long id);

    @Query(
            "select o from CustomerOrder o join fetch o.menu where o.status <>"
                    + " fr.vitegourmand.order.entity.OrderStatus.CANCELLED")
    List<CustomerOrder> findAllBillable();
}
