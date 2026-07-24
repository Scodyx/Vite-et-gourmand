package fr.vitegourmand.menu.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "menu")
public class Menu {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private String title;
    @Column(nullable = false, unique = true) private String slug;
    @Column(nullable = false, columnDefinition = "text") private String description;
    @Column(nullable = false, columnDefinition = "text") private String conditions;
    @Column(name = "minimum_persons", nullable = false) private int minimumPersons;
    @Column(name = "base_price", nullable = false, precision = 10, scale = 2) private BigDecimal basePrice;
    @Column(name = "available_stock", nullable = false) private int availableStock;
    @Column(nullable = false) private boolean active = true;
    @Column(nullable = false) private String theme;
    @Column(nullable = false) private String diet;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getSlug() { return slug; }
    public String getDescription() { return description; }
    public String getConditions() { return conditions; }
    public int getMinimumPersons() { return minimumPersons; }
    public BigDecimal getBasePrice() { return basePrice; }
    public int getAvailableStock() { return availableStock; }
    public boolean isActive() { return active; }
    public String getTheme() { return theme; }
    public String getDiet() { return diet; }
}
