package fr.vitegourmand.auth.entity;
import fr.vitegourmand.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="password_reset_token")
public class PasswordResetToken {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="token_hash",nullable=false,unique=true) private String tokenHash;
 @ManyToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="user_id") private User user;
 @Column(name="expires_at",nullable=false) private Instant expiresAt;
 @Column(name="used_at") private Instant usedAt;
 @Column(name="created_at",nullable=false) private Instant createdAt=Instant.now();
 public static PasswordResetToken create(String hash,User user,Instant expiry){var t=new PasswordResetToken();t.tokenHash=hash;t.user=user;t.expiresAt=expiry;return t;}
 public User getUser(){return user;} public Instant getExpiresAt(){return expiresAt;} public Instant getUsedAt(){return usedAt;}
 public void use(){usedAt=Instant.now();}
}
