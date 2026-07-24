package fr.vitegourmand.order.entity;

import fr.vitegourmand.menu.entity.Menu;
import fr.vitegourmand.user.entity.User;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "customer_order")
public class CustomerOrder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name="order_number", nullable=false, unique=true) private String orderNumber;
    @ManyToOne(optional=false, fetch=FetchType.LAZY) @JoinColumn(name="customer_id") private User customer;
    @ManyToOne(optional=false, fetch=FetchType.LAZY) @JoinColumn(name="menu_id") private Menu menu;
    @Column(name="person_count", nullable=false) private int personCount;
    @Column(name="prestation_date", nullable=false) private LocalDate prestationDate;
    @Column(name="desired_delivery_time", nullable=false) private LocalTime desiredDeliveryTime;
    @Column(name="delivery_address", nullable=false) private String deliveryAddress;
    @Column(name="delivery_postal_code", nullable=false) private String deliveryPostalCode;
    @Column(name="delivery_city", nullable=false) private String deliveryCity;
    @Column(name="delivery_country", nullable=false) private String deliveryCountry;
    @Column(name="distance_km", nullable=false) private BigDecimal distanceKm;
    @Column(name="outside_bordeaux", nullable=false) private boolean outsideBordeaux;
    @Column(name="menu_amount", nullable=false) private BigDecimal menuAmount;
    @Column(name="delivery_amount", nullable=false) private BigDecimal deliveryAmount;
    @Column(name="discount_amount", nullable=false) private BigDecimal discountAmount;
    @Column(name="total_amount", nullable=false) private BigDecimal totalAmount;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private OrderStatus status;
    @Column(name="equipment_loaned", nullable=false) private boolean equipmentLoaned;
    @Column(name="equipment_returned_at") private Instant equipmentReturnedAt;
    @Column(name="cancellation_reason", columnDefinition="text") private String cancellationReason;
    @Enumerated(EnumType.STRING) @Column(name="cancellation_contact_mode") private CancellationContactMode cancellationContactMode;
    @Column(name="cancellation_contact_at") private Instant cancellationContactAt;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="cancelled_by") private User cancelledBy;
    @Column(name="cancelled_at") private Instant cancelledAt;
    @Column(name="created_at", nullable=false) private Instant createdAt = Instant.now();
    @Column(name="updated_at", nullable=false) private Instant updatedAt = Instant.now();

    public Long getId(){return id;} public String getOrderNumber(){return orderNumber;}
    public User getCustomer(){return customer;} public Menu getMenu(){return menu;}
    public int getPersonCount(){return personCount;} public LocalDate getPrestationDate(){return prestationDate;}
    public LocalTime getDesiredDeliveryTime(){return desiredDeliveryTime;} public String getDeliveryAddress(){return deliveryAddress;}
    public String getDeliveryPostalCode(){return deliveryPostalCode;} public String getDeliveryCity(){return deliveryCity;}
    public String getDeliveryCountry(){return deliveryCountry;} public BigDecimal getDistanceKm(){return distanceKm;}
    public boolean isOutsideBordeaux(){return outsideBordeaux;} public BigDecimal getMenuAmount(){return menuAmount;}
    public BigDecimal getDeliveryAmount(){return deliveryAmount;} public BigDecimal getDiscountAmount(){return discountAmount;}
    public BigDecimal getTotalAmount(){return totalAmount;} public OrderStatus getStatus(){return status;}
    public boolean isEquipmentLoaned(){return equipmentLoaned;} public Instant getCreatedAt(){return createdAt;}
    public void setOrderNumber(String v){orderNumber=v;} public void setCustomer(User v){customer=v;} public void setMenu(Menu v){menu=v;}
    public void setPersonCount(int v){personCount=v;} public void setPrestationDate(LocalDate v){prestationDate=v;}
    public void setDesiredDeliveryTime(LocalTime v){desiredDeliveryTime=v;} public void setDeliveryAddress(String v){deliveryAddress=v;}
    public void setDeliveryPostalCode(String v){deliveryPostalCode=v;} public void setDeliveryCity(String v){deliveryCity=v;}
    public void setDeliveryCountry(String v){deliveryCountry=v;} public void setDistanceKm(BigDecimal v){distanceKm=v;}
    public void setOutsideBordeaux(boolean v){outsideBordeaux=v;} public void setMenuAmount(BigDecimal v){menuAmount=v;}
    public void setDeliveryAmount(BigDecimal v){deliveryAmount=v;} public void setDiscountAmount(BigDecimal v){discountAmount=v;}
    public void setTotalAmount(BigDecimal v){totalAmount=v;} public void setStatus(OrderStatus v){status=v; updatedAt=Instant.now();}
    public void setEquipmentLoaned(boolean v){equipmentLoaned=v;} public void setEquipmentReturnedAt(Instant v){equipmentReturnedAt=v;}
    public void cancel(String reason, CancellationContactMode mode, User actor){cancellationReason=reason; cancellationContactMode=mode;
        cancellationContactAt=Instant.now(); cancelledAt=Instant.now(); cancelledBy=actor; setStatus(OrderStatus.CANCELLED);}
}
