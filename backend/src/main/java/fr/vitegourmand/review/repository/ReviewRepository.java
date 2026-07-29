package fr.vitegourmand.review.repository;

import fr.vitegourmand.review.entity.ModerationStatus;
import fr.vitegourmand.review.entity.Review;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByOrderId(Long orderId);

    List<Review> findByModerationStatusOrderByCreatedAtDesc(ModerationStatus status);
}
