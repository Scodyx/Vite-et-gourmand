package fr.vitegourmand.order.dto;
import fr.vitegourmand.order.entity.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.List;
public final class OrderDtos {
 private OrderDtos(){}
 public record Create(@NotNull Long menuId,@Min(1) int personCount,@NotNull @FutureOrPresent LocalDate prestationDate,
  @NotNull LocalTime desiredDeliveryTime,@NotBlank String deliveryAddress,@NotBlank String deliveryPostalCode,
  @NotBlank String deliveryCity,@NotBlank String deliveryCountry,@NotNull @DecimalMin("0.0") BigDecimal distanceKm,
  boolean outsideBordeaux,boolean equipmentLoaned){}
 public record Transition(@NotNull OrderStatus status,String comment){}
 public record Cancellation(@NotBlank String reason,@NotNull CancellationContactMode contactMode){}
 public record Update(@Min(1) int personCount,@NotNull @FutureOrPresent LocalDate prestationDate,
  @NotNull LocalTime desiredDeliveryTime,@NotBlank String deliveryAddress,@NotBlank String deliveryPostalCode,
  @NotBlank String deliveryCity,@NotBlank String deliveryCountry,@NotNull @DecimalMin("0.0") BigDecimal distanceKm){}
 public record View(Long id,String orderNumber,Long menuId,String menuTitle,int personCount,LocalDate prestationDate,
  LocalTime desiredDeliveryTime,String deliveryAddress,String deliveryPostalCode,String deliveryCity,
  String deliveryCountry,BigDecimal distanceKm,
  BigDecimal menuAmount,BigDecimal discountAmount,BigDecimal deliveryAmount,BigDecimal totalAmount,
  OrderStatus status,boolean equipmentLoaned,String cancellationReason,Instant createdAt){
  public static View from(CustomerOrder o){return new View(o.getId(),o.getOrderNumber(),o.getMenu().getId(),o.getMenu().getTitle(),
   o.getPersonCount(),o.getPrestationDate(),o.getDesiredDeliveryTime(),o.getDeliveryAddress(),o.getDeliveryPostalCode(),
   o.getDeliveryCity(),o.getDeliveryCountry(),o.getDistanceKm(),o.getMenuAmount(),o.getDiscountAmount(),o.getDeliveryAmount(),
   o.getTotalAmount(),o.getStatus(),o.isEquipmentLoaned(),o.getCancellationReason(),o.getCreatedAt());}
 }
 public record History(OrderStatus previousStatus,OrderStatus newStatus,Instant changedAt,String actor,String comment){}
 public record Detail(View order,List<History> history,boolean reviewSubmitted){}
}
