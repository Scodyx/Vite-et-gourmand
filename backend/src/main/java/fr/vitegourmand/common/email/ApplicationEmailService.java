package fr.vitegourmand.common.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class ApplicationEmailService {
    private static final Logger log = LoggerFactory.getLogger(ApplicationEmailService.class);
    private final JavaMailSender sender;
    private final String contactEmail;
    private final String fromEmail;

    public ApplicationEmailService(
            JavaMailSender sender,
            @Value("${app.contact-email}") String contactEmail,
            @Value("${app.mail.from}") String fromEmail) {
        this.sender = sender;
        this.contactEmail = contactEmail;
        this.fromEmail = fromEmail;
    }

    public void send(String to, String subject, String body) {
        try {
            var m = new SimpleMailMessage();
            m.setFrom(fromEmail);
            m.setTo(to);
            m.setSubject(subject);
            m.setText(body);
            sender.send(m);
        } catch (RuntimeException e) {
            log.warn("Échec d'envoi de l'e-mail '{}': {}", subject, e.getClass().getSimpleName());
        }
    }

    public void welcome(String to, String firstName) {
        send(
                to,
                "Bienvenue chez Vite & Gourmand",
                "Bonjour " + firstName + ",\n\nVotre espace client est prêt.");
    }

    public void orderConfirmation(String to, String number) {
        send(
                to,
                "Confirmation de commande " + number,
                "Votre commande " + number + " a bien été enregistrée et attend notre validation.");
    }

    public void cancellation(String to, String number) {
        send(to, "Annulation de la commande " + number, "La commande " + number + " a été annulée.");
    }

    public void equipmentReturn(String to, String number) {
        send(
                to,
                "Retour du matériel – " + number,
                "Merci de restituer le matériel sous 10 jours ouvrés. Des frais contractuels de 600 € sont"
                        + " prévus par les CGV en cas de non-retour.");
    }

    public void reviewInvitation(String to, String number) {
        send(
                to,
                "Votre avis sur la commande " + number,
                "Votre prestation est terminée. Vous pouvez maintenant partager votre avis depuis votre"
                        + " espace.");
    }

    public void employeeCreated(String to, String firstName) {
        send(
                to,
                "Votre compte employé Vite & Gourmand",
                "Bonjour "
                        + firstName
                        + ",\n\n"
                        + "Votre compte employé a été créé. Contactez l’administrateur pour recevoir votre mot"
                        + " de passe temporaire par un canal séparé.");
    }

    public void contactNotification(String replyTo, String title, String body) {
        send(contactEmail, "Contact – " + title, "Répondre à : " + replyTo + "\n\n" + body);
    }
}
