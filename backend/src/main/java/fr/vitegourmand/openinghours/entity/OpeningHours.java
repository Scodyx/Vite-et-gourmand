package fr.vitegourmand.openinghours.entity;
import jakarta.persistence.*;
import java.time.*;
@Entity @Table(name="opening_hours")
public class OpeningHours {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Enumerated(EnumType.STRING) @Column(name="day_of_week",nullable=false,unique=true) private DayOfWeek dayOfWeek;
 @Column(name="opening_time") private LocalTime openingTime;
 @Column(name="closing_time") private LocalTime closingTime;
 @Column(nullable=false) private boolean closed;
 @Column(name="display_order",nullable=false,unique=true) private int displayOrder;
 public Long getId(){return id;} public DayOfWeek getDayOfWeek(){return dayOfWeek;} public LocalTime getOpeningTime(){return openingTime;}
 public LocalTime getClosingTime(){return closingTime;} public boolean isClosed(){return closed;} public int getDisplayOrder(){return displayOrder;}
 public void setDayOfWeek(DayOfWeek v){dayOfWeek=v;} public void setOpeningTime(LocalTime v){openingTime=v;}
 public void setClosingTime(LocalTime v){closingTime=v;} public void setClosed(boolean v){closed=v;} public void setDisplayOrder(int v){displayOrder=v;}
}
