package fr.vitegourmand.order.entity;
import fr.vitegourmand.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="order_status_history")
public class OrderStatusHistory {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="order_id") private CustomerOrder order;
 @Enumerated(EnumType.STRING) @Column(name="previous_status") private OrderStatus previousStatus;
 @Enumerated(EnumType.STRING) @Column(name="new_status",nullable=false) private OrderStatus newStatus;
 @Column(name="changed_at",nullable=false) private Instant changedAt=Instant.now();
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="changed_by") private User changedBy;
 @Column(columnDefinition="text") private String comment;
 public static OrderStatusHistory of(CustomerOrder o,OrderStatus before,OrderStatus after,User by,String comment){
  var h=new OrderStatusHistory();h.order=o;h.previousStatus=before;h.newStatus=after;h.changedBy=by;h.comment=comment;return h;
 }
 public OrderStatus getPreviousStatus(){return previousStatus;} public OrderStatus getNewStatus(){return newStatus;}
 public Instant getChangedAt(){return changedAt;} public String getComment(){return comment;}
}
