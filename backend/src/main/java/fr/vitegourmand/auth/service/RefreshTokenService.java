package fr.vitegourmand.auth.service;

import fr.vitegourmand.auth.dto.SessionDtos.Session;
import fr.vitegourmand.auth.entity.RefreshToken;
import fr.vitegourmand.auth.repository.RefreshTokenRepository;
import fr.vitegourmand.common.exception.AuthenticationException;
import fr.vitegourmand.security.JwtService;
import fr.vitegourmand.user.entity.User;
import fr.vitegourmand.user.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RefreshTokenService {
    private final RefreshTokenRepository tokens;
    private final UserRepository users;
    private final JwtService jwt;
    private final long expiration;

    public RefreshTokenService(
            RefreshTokenRepository tokens,
            UserRepository users,
            JwtService jwt,
            @Value("${app.jwt.refresh-expiration}") long expiration) {
        this.tokens = tokens;
        this.users = users;
        this.jwt = jwt;
        this.expiration = expiration;
    }

    @Transactional
    public Session issue(String email) {
        return session(user(email));
    }

    @Transactional
    public Session rotate(String raw) {
        var current =
                tokens
                        .findByTokenHash(hash(raw))
                        .filter(
                                token ->
                                        token.getRevokedAt() == null && token.getExpiresAt().isAfter(Instant.now()))
                        .orElseThrow(() -> new AuthenticationException("Refresh token invalide ou expiré"));
        if (!current.getUser().isEnabled()) throw new AuthenticationException("Compte désactivé");
        current.revoke();
        return session(current.getUser());
    }

    @Transactional
    public void revoke(String raw) {
        tokens
                .findByTokenHash(hash(raw))
                .filter(token -> token.getRevokedAt() == null)
                .ifPresent(RefreshToken::revoke);
    }

    private Session session(User user) {
        String raw = random();
        tokens.save(RefreshToken.create(hash(raw), user, Instant.now().plusMillis(expiration)));
        return new Session(
                jwt.generate(user), raw, "Bearer", jwt.expirationSeconds(), user.getRole().name());
    }

    private User user(String email) {
        return users
                .findByEmailIgnoreCase(email.trim())
                .filter(User::isEnabled)
                .orElseThrow(() -> new AuthenticationException("Identifiants invalides"));
    }

    private String random() {
        var bytes = new byte[48];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String raw) {
        try {
            return HexFormat.of()
                    .formatHex(
                            MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
