package fr.vitegourmand.menu.entity;

import fr.vitegourmand.dish.entity.Dish;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "menu")
public class Menu {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Column(nullable = false, columnDefinition = "text")
    private String conditions;

    @Column(name = "minimum_persons", nullable = false)
    private int minimumPersons;

    @Column(name = "base_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "available_stock", nullable = false)
    private int availableStock;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private String theme;

    @Column(nullable = false)
    private String diet;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @ManyToMany
    @JoinTable(
            name = "menu_dish",
            joinColumns = @JoinColumn(name = "menu_id"),
            inverseJoinColumns = @JoinColumn(name = "dish_id"))
    private Set<Dish> dishes = new HashSet<>();

    @OneToMany(mappedBy = "menu", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<MenuImage> images = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getSlug() {
        return slug;
    }

    public String getDescription() {
        return description;
    }

    public String getConditions() {
        return conditions;
    }

    public int getMinimumPersons() {
        return minimumPersons;
    }

    public BigDecimal getBasePrice() {
        return basePrice;
    }

    public int getAvailableStock() {
        return availableStock;
    }

    public boolean isActive() {
        return active;
    }

    public String getTheme() {
        return theme;
    }

    public String getDiet() {
        return diet;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Set<Dish> getDishes() {
        return dishes;
    }

    public List<MenuImage> getImages() {
        return images;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setConditions(String conditions) {
        this.conditions = conditions;
    }

    public void setMinimumPersons(int minimumPersons) {
        this.minimumPersons = minimumPersons;
    }

    public void setBasePrice(BigDecimal basePrice) {
        this.basePrice = basePrice;
    }

    public void setAvailableStock(int availableStock) {
        this.availableStock = availableStock;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public void setDiet(String diet) {
        this.diet = diet;
    }

    public void touch() {
        this.updatedAt = Instant.now();
    }
}
