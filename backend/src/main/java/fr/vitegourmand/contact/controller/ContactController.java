package fr.vitegourmand.contact.controller;
import fr.vitegourmand.contact.dto.ContactRequestDto;
import fr.vitegourmand.contact.entity.ContactRequest;
import fr.vitegourmand.contact.repository.ContactRequestRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/public/contact")
public class ContactController {
 private final ContactRequestRepository repository; private final JavaMailSender mail; private final String recipient;
 public ContactController(ContactRequestRepository repository,JavaMailSender mail,@Value("${app.contact-email}")String recipient){
  this.repository=repository;this.mail=mail;this.recipient=recipient;
 }
 @PostMapping @ResponseStatus(HttpStatus.ACCEPTED)
 public void send(@Valid @RequestBody ContactRequestDto dto){
  var entity=new ContactRequest();entity.setEmail(dto.email().toLowerCase());entity.setTitle(dto.title());entity.setMessage(dto.message());repository.save(entity);
  var message=new SimpleMailMessage();message.setTo(recipient);message.setReplyTo(dto.email());message.setSubject("[Contact V&G] "+dto.title());message.setText(dto.message());mail.send(message);
 }
}
