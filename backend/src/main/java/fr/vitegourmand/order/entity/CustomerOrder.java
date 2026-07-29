package fr.vitegourmand.order.entity;

import fr.vitegourmand.menu.entity.Menu;
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
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "customer_order")
public class CustomerOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true)
    private String orderNumber;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private User customer;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_id")
    private Menu menu;

    @Column(name = "person_count", nullable = false)
    private int personCount;

    @Column(name = "prestation_date", nullable = false)
    private LocalDate prestationDate;

    @Column(name = "desired_delivery_time", nullable = false)
    private LocalTime desiredDeliveryTime;

    @Column(name = "delivery_address", nullable = false)
    private String deliveryAddress;

    @Column(name = "delivery_postal_code", nullable = false)
    private String deliveryPostalCode;

    @Column(name = "delivery_city", nullable = false)
    private String deliveryCity;

    @Column(name = "delivery_country", nullable = false)
    private String deliveryCountry;

    @Column(name = "distance_km", nullable = false)
    private BigDecimal distanceKm;

    @Column(name = "outside_bordeaux", nullable = false)
    private boolean outsideBordeaux;

    @Column(name = "menu_amount", nullable = false)
    private BigDecimal menuAmount;

    @Column(name = "delivery_amount", nullable = false)
    private BigDecimal deliveryAmount;

    @Column(name = "discount_amount", nullable = false)
    private BigDecimal discountAmount;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(name = "equipment_loaned", nullable = false)
    private boolean equipmentLoaned;

    @Column(name = "equipment_returned_at")
    private Instant equipmentReturnedAt;

    @Column(name = "cancellation_reason", columnDefinition = "text")
    private String cancellationReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "cancellation_contact_mode")
    private CancellationContactMode cancellationContactMode;

    @Column(name = "cancellation_contact_at")
    private Instant cancellationContactAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelled_by")
    private User cancelledBy;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Long getId() {
        return id;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public User getCustomer() {
        return customer;
    }

    public Menu getMenu() {
        return menu;
    }

    public int getPersonCount() {
        return personCount;
    }

    public LocalDate getPrestationDate() {
        return prestationDate;
    }

    public LocalTime getDesiredDeliveryTime() {
        return desiredDeliveryTime;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public String getDeliveryPostalCode() {
        return deliveryPostalCode;
    }

    public String getDeliveryCity() {
        return deliveryCity;
    }

    public String getDeliveryCountry() {
        return deliveryCountry;
    }

    public BigDecimal getDistanceKm() {
        return distanceKm;
    }

    public boolean isOutsideBordeaux() {
        return outsideBordeaux;
    }

    public BigDecimal getMenuAmount() {
        return menuAmount;
    }

    public BigDecimal getDeliveryAmount() {
        return deliveryAmount;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public boolean isEquipmentLoaned() {
        return equipmentLoaned;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public void setCustomer(User customer) {
        this.customer = customer;
    }

    public void setMenu(Menu menu) {
        this.menu = menu;
    }

    public void setPersonCount(int personCount) {
        this.personCount = personCount;
    }

    public void setPrestationDate(LocalDate prestationDate) {
        this.prestationDate = prestationDate;
    }

    public void setDesiredDeliveryTime(LocalTime desiredDeliveryTime) {
        this.desiredDeliveryTime = desiredDeliveryTime;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public void setDeliveryPostalCode(String deliveryPostalCode) {
        this.deliveryPostalCode = deliveryPostalCode;
    }

    public void setDeliveryCity(String deliveryCity) {
        this.deliveryCity = deliveryCity;
    }

    public void setDeliveryCountry(String deliveryCountry) {
        this.deliveryCountry = deliveryCountry;
    }

    public void setDistanceKm(BigDecimal distanceKm) {
        this.distanceKm = distanceKm;
    }

    public void setOutsideBordeaux(boolean outsideBordeaux) {
        this.outsideBordeaux = outsideBordeaux;
    }

    public void setMenuAmount(BigDecimal menuAmount) {
        this.menuAmount = menuAmount;
    }

    public void setDeliveryAmount(BigDecimal deliveryAmount) {
        this.deliveryAmount = deliveryAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public void setStatus(OrderStatus v) {
        status = v;
        updatedAt = Instant.now();
    }

    public void setEquipmentLoaned(boolean equipmentLoaned) {
        this.equipmentLoaned = equipmentLoaned;
    }

    public void setEquipmentReturnedAt(Instant equipmentReturnedAt) {
        this.equipmentReturnedAt = equipmentReturnedAt;
    }

    public void cancel(String reason, CancellationContactMode mode, User actor) {
        cancellationReason = reason;
        cancellationContactMode = mode;
        cancellationContactAt = Instant.now();
        cancelledAt = Instant.now();
        cancelledBy = actor;
        setStatus(OrderStatus.CANCELLED);
    }
}
