package fr.vitegourmand.auth.service;

import fr.vitegourmand.auth.dto.PasswordResetDtos.Forgot;
import fr.vitegourmand.auth.dto.PasswordResetDtos.Reset;
import fr.vitegourmand.auth.entity.PasswordResetToken;
import fr.vitegourmand.auth.repository.PasswordResetTokenRepository;
import fr.vitegourmand.common.exception.BusinessException;
import fr.vitegourmand.user.entity.User;
import fr.vitegourmand.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PasswordResetServiceTest {
    @Test void unknownEmailRemainsNeutralAndSendsNoMessage() {
        var users = mock(UserRepository.class);
        var mail = mock(JavaMailSender.class);
        var service = new PasswordResetService(users, mock(PasswordResetTokenRepository.class),
                mock(PasswordEncoder.class), mail, "http://localhost:4200");

        assertThatCode(() -> service.forgot(new Forgot("unknown@example.test"))).doesNotThrowAnyException();
        verify(mail, never()).send(any(org.springframework.mail.SimpleMailMessage.class));
    }

    @Test void validResetChangesPasswordAndConsumesToken() {
        var user = new User();
        var token = PasswordResetToken.create("hash", user, Instant.now().plusSeconds(60));
        var tokens = mock(PasswordResetTokenRepository.class);
        var encoder = mock(PasswordEncoder.class);
        when(tokens.findByTokenHash(any())).thenReturn(Optional.of(token));
        when(encoder.encode("NouveauMotDePasse1!")).thenReturn("new-hash");
        var service = new PasswordResetService(mock(UserRepository.class), tokens, encoder,
                mock(JavaMailSender.class), "http://localhost:4200");

        service.reset(new Reset("raw", "NouveauMotDePasse1!"));

        assertThat(user.getPasswordHash()).isEqualTo("new-hash");
        assertThat(token.getUsedAt()).isNotNull();
    }

    @Test void expiredResetTokenIsRejected() {
        var tokens = mock(PasswordResetTokenRepository.class);
        when(tokens.findByTokenHash(any())).thenReturn(Optional.of(
                PasswordResetToken.create("hash", new User(), Instant.now().minusSeconds(1))));
        var service = new PasswordResetService(mock(UserRepository.class), tokens,
                mock(PasswordEncoder.class), mock(JavaMailSender.class), "http://localhost:4200");

        assertThatThrownBy(() -> service.reset(new Reset("raw", "NouveauMotDePasse1!")))
                .isInstanceOf(BusinessException.class);
    }
}
