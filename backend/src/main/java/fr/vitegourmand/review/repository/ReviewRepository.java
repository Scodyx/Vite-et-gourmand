package fr.vitegourmand.review.repository;
import fr.vitegourmand.review.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ReviewRepository extends JpaRepository<Review,Long>{
 boolean existsByOrderId(Long orderId);
 List<Review> findByModerationStatusOrderByCreatedAtDesc(ModerationStatus status);
}
