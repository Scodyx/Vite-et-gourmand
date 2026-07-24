package fr.vitegourmand.contact.entity;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="contact_request")
public class ContactRequest {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false) private String email;
 @Column(nullable=false) private String title;
 @Column(nullable=false,columnDefinition="text") private String message;
 @Column(name="created_at",nullable=false) private Instant createdAt=Instant.now();
 @Column(nullable=false) private boolean processed=false;
 public void setEmail(String v){email=v;} public void setTitle(String v){title=v;} public void setMessage(String v){message=v;}
}
