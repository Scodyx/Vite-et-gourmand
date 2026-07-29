package fr.vitegourmand.auth.service;

import fr.vitegourmand.auth.dto.PasswordResetDtos.Forgot;
import fr.vitegourmand.auth.dto.PasswordResetDtos.Reset;
import fr.vitegourmand.auth.entity.PasswordResetToken;
import fr.vitegourmand.auth.repository.PasswordResetTokenRepository;
import fr.vitegourmand.common.exception.BusinessException;
import fr.vitegourmand.user.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PasswordResetService {
    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final PasswordEncoder passwords;
    private final JavaMailSender mail;
    private final String frontendUrl;

    public PasswordResetService(
            UserRepository users,
            PasswordResetTokenRepository tokens,
            PasswordEncoder passwords,
            JavaMailSender mail,
            @Value("${app.frontend-url}") String frontendUrl) {
        this.users = users;
        this.tokens = tokens;
        this.passwords = passwords;
        this.mail = mail;
        this.frontendUrl = frontendUrl;
    }

    @Transactional
    public void forgot(Forgot request) {
        users
                .findByEmailIgnoreCase(request.email().trim())
                .filter(user -> user.isEnabled())
                .ifPresent(
                        user -> {
                            var rawToken = UUID.randomUUID() + "." + UUID.randomUUID();
                            tokens.save(
                                    PasswordResetToken.create(
                                            hash(rawToken), user, Instant.now().plus(Duration.ofMinutes(30))));
                            var message = new SimpleMailMessage();
                            message.setTo(user.getEmail());
                            message.setSubject("Réinitialisation de votre mot de passe");
                            message.setText(
                                    "Utilisez ce lien dans les 30 minutes : "
                                            + frontendUrl
                                            + "/reinitialisation?token="
                                            + rawToken);
                            mail.send(message);
                        });
    }

    @Transactional
    public void reset(Reset request) {
        var token =
                tokens
                        .findByTokenHash(hash(request.token()))
                        .filter(
                                storedToken ->
                                        storedToken.getUsedAt() == null
                                                && storedToken.getExpiresAt().isAfter(Instant.now()))
                        .orElseThrow(() -> new BusinessException("Jeton invalide ou expiré"));
        token.getUser().setPasswordHash(passwords.encode(request.password()));
        token.use();
    }

    private String hash(String rawToken) {
        try {
            return HexFormat.of()
                    .formatHex(
                            MessageDigest.getInstance("SHA-256")
                                    .digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
