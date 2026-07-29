package fr.vitegourmand.review.service;

import fr.vitegourmand.common.exception.BusinessException;
import fr.vitegourmand.common.exception.NotFoundException;
import fr.vitegourmand.order.entity.OrderStatus;
import fr.vitegourmand.order.repository.CustomerOrderRepository;
import fr.vitegourmand.review.dto.ReviewDtos.Create;
import fr.vitegourmand.review.dto.ReviewDtos.View;
import fr.vitegourmand.review.entity.ModerationStatus;
import fr.vitegourmand.review.entity.Review;
import fr.vitegourmand.review.repository.ReviewRepository;
import fr.vitegourmand.user.entity.User;
import fr.vitegourmand.user.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {
    private final ReviewRepository reviews;
    private final CustomerOrderRepository orders;
    private final UserRepository users;

    public ReviewService(
            ReviewRepository reviews, CustomerOrderRepository orders, UserRepository users) {
        this.reviews = reviews;
        this.orders = orders;
        this.users = users;
    }

    @Transactional
    public View create(String email, Long orderId, Create request) {
        var order =
                orders
                        .findByIdAndCustomerEmailIgnoreCase(orderId, email)
                        .orElseThrow(() -> new NotFoundException("Commande introuvable"));
        if (order.getStatus() != OrderStatus.COMPLETED)
            throw new BusinessException("Un avis est possible uniquement après une commande terminée");
        if (reviews.existsByOrderId(orderId))
            throw new BusinessException("Un avis existe déjà pour cette commande");
        var review = new Review();
        review.setCustomer(order.getCustomer());
        review.setOrder(order);
        review.setRating(request.rating());
        review.setComment(request.comment().trim());
        return view(reviews.save(review));
    }

    @Transactional(readOnly = true)
    public List<View> publicApproved() {
        return reviews.findByModerationStatusOrderByCreatedAtDesc(ModerationStatus.APPROVED).stream()
                .map(this::view)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<View> pending() {
        return reviews.findByModerationStatusOrderByCreatedAtDesc(ModerationStatus.PENDING).stream()
                .map(this::view)
                .toList();
    }

    @Transactional
    public View moderate(String email, Long id, ModerationStatus status) {
        if (status == ModerationStatus.PENDING)
            throw new BusinessException("Statut de modération invalide");
        var reviewer =
                reviews.findById(id).orElseThrow(() -> new NotFoundException("Avis introuvable"));
        reviewer.moderate(status, user(email));
        return view(reviewer);
    }

    private User user(String email) {
        return users
                .findByEmailIgnoreCase(email)
                .filter(User::isEnabled)
                .orElseThrow(() -> new NotFoundException("Utilisateur introuvable"));
    }

    private View view(Review r) {
        return new View(
                r.getId(),
                r.getOrder().getId(),
                r.getOrder().getMenu().getTitle(),
                r.getCustomer().getFirstName(),
                r.getRating(),
                r.getComment(),
                r.getModerationStatus(),
                r.getCreatedAt());
    }
}
