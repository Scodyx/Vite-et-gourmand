package fr.vitegourmand.contact.controller;

import fr.vitegourmand.contact.dto.ContactRequestDto;
import fr.vitegourmand.contact.entity.ContactRequest;
import fr.vitegourmand.contact.repository.ContactRequestRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/contact")
public class ContactController {
    private final ContactRequestRepository repository;
    private final JavaMailSender mail;
    private final String recipient;
    private final String from;

    public ContactController(
            ContactRequestRepository repository,
            JavaMailSender mail,
            @Value("${app.contact-email}") String recipient,
            @Value("${app.mail.from}") String from) {
        this.repository = repository;
        this.mail = mail;
        this.recipient = recipient;
        this.from = from;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void send(@Valid @RequestBody ContactRequestDto dto) {
        var entity = new ContactRequest();
        entity.setEmail(dto.email().toLowerCase());
        entity.setTitle(dto.title());
        entity.setMessage(dto.message());
        repository.save(entity);
        var message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(recipient);
        message.setReplyTo(dto.email());
        message.setSubject("[Contact V&G] " + dto.title());
        message.setText(dto.message());
        mail.send(message);
    }
}
