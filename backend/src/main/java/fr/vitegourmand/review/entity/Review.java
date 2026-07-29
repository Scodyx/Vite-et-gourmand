package fr.vitegourmand.review.entity;

import fr.vitegourmand.order.entity.CustomerOrder;
import fr.vitegourmand.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "review")
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private User customer;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", unique = true)
    private CustomerOrder order;

    @Column(nullable = false)
    private int rating;

    @Column(nullable = false, columnDefinition = "text")
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(name = "moderation_status", nullable = false)
    private ModerationStatus moderationStatus = ModerationStatus.PENDING;

    @Column(name = "moderated_at")
    private Instant moderatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moderated_by")
    private User moderatedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() {
        return id;
    }

    public User getCustomer() {
        return customer;
    }

    public CustomerOrder getOrder() {
        return order;
    }

    public int getRating() {
        return rating;
    }

    public String getComment() {
        return comment;
    }

    public ModerationStatus getModerationStatus() {
        return moderationStatus;
    }

    public Instant getModeratedAt() {
        return moderatedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCustomer(User customer) {
        this.customer = customer;
    }

    public void setOrder(CustomerOrder order) {
        this.order = order;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public void moderate(ModerationStatus status, User moderator) {
        moderationStatus = status;
        moderatedBy = moderator;
        moderatedAt = Instant.now();
    }
}
