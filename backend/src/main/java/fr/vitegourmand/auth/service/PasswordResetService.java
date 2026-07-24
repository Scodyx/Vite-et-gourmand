package fr.vitegourmand.auth.service;
import fr.vitegourmand.auth.dto.PasswordResetDtos.*;
import fr.vitegourmand.auth.entity.PasswordResetToken;
import fr.vitegourmand.auth.repository.PasswordResetTokenRepository;
import fr.vitegourmand.common.exception.BusinessException;
import fr.vitegourmand.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
@Service
public class PasswordResetService {
 private final UserRepository users;private final PasswordResetTokenRepository tokens;private final PasswordEncoder passwords;
 private final JavaMailSender mail;private final String frontendUrl;
 public PasswordResetService(UserRepository u,PasswordResetTokenRepository t,PasswordEncoder p,JavaMailSender m,
  @Value("${app.frontend-url}") String f){users=u;tokens=t;passwords=p;mail=m;frontendUrl=f;}
 @Transactional public void forgot(Forgot request){
  users.findByEmailIgnoreCase(request.email().trim()).filter(u->u.isEnabled()).ifPresent(user->{
   var raw=UUID.randomUUID()+"."+UUID.randomUUID();tokens.save(PasswordResetToken.create(hash(raw),user,Instant.now().plus(Duration.ofMinutes(30))));
   var message=new SimpleMailMessage();message.setTo(user.getEmail());message.setSubject("Réinitialisation de votre mot de passe");
   message.setText("Utilisez ce lien dans les 30 minutes : "+frontendUrl+"/reinitialisation?token="+raw);mail.send(message);
  });
 }
 @Transactional public void reset(Reset request){
  var token=tokens.findByTokenHash(hash(request.token())).filter(t->t.getUsedAt()==null&&t.getExpiresAt().isAfter(Instant.now()))
   .orElseThrow(()->new BusinessException("Jeton invalide ou expiré"));
  token.getUser().setPasswordHash(passwords.encode(request.password()));token.use();
 }
 private String hash(String raw){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));}
  catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}}
}
