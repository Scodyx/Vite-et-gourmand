package fr.vitegourmand.auth.service;

import fr.vitegourmand.auth.dto.RegisterRequest;
import fr.vitegourmand.auth.dto.LoginRequest;
import fr.vitegourmand.common.exception.BusinessException;
import fr.vitegourmand.security.JwtService;
import fr.vitegourmand.user.entity.Role;
import fr.vitegourmand.user.entity.User;
import fr.vitegourmand.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {
    @Test void publicRegistrationAlwaysCreatesUserRole() {
        var users = mock(UserRepository.class);
        var encoder = mock(PasswordEncoder.class);
        var jwt = mock(JwtService.class);
        when(encoder.encode(any())).thenReturn("hash");
        when(jwt.generate(any())).thenReturn("token");
        var service = new AuthService(users, encoder, jwt);
        service.register(new RegisterRequest("Julie", "Test", "0102030405", "TEST@EXAMPLE.FR",
                "1 rue Test", "33000", "Bordeaux", "France", "MotDePasse1!", true));
        var captor = ArgumentCaptor.forClass(fr.vitegourmand.user.entity.User.class);
        verify(users).save(captor.capture());
        assertThat(captor.getValue().getRole()).isEqualTo(Role.USER);
        assertThat(captor.getValue().getEmail()).isEqualTo("test@example.fr");
    }

    @Test void duplicateRegistrationIsRejected() {
        var users = mock(UserRepository.class);
        when(users.existsByEmailIgnoreCase("test@example.fr")).thenReturn(true);
        var service = new AuthService(users, mock(PasswordEncoder.class), mock(JwtService.class));

        assertThatThrownBy(() -> service.register(new RegisterRequest("Julie", "Test", null,
                " TEST@EXAMPLE.FR ", null, null, null, null, "MotDePasse1!", true)))
                .isInstanceOf(BusinessException.class);
        verify(users, never()).save(any());
    }

    @Test void disabledAccountCannotLogin() {
        var users = mock(UserRepository.class);
        var disabled = new User();
        disabled.setEnabled(false);
        when(users.findByEmailIgnoreCase("test@example.fr")).thenReturn(Optional.of(disabled));
        var service = new AuthService(users, mock(PasswordEncoder.class), mock(JwtService.class));

        assertThatThrownBy(() -> service.login(new LoginRequest("test@example.fr", "MotDePasse1!")))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Identifiants invalides");
    }

    @Test void invalidPasswordCannotLogin() {
        var users = mock(UserRepository.class);
        var encoder = mock(PasswordEncoder.class);
        var user = new User();
        user.setEnabled(true);
        user.setPasswordHash("hash");
        when(users.findByEmailIgnoreCase("test@example.fr")).thenReturn(Optional.of(user));
        when(encoder.matches("incorrect", "hash")).thenReturn(false);
        var service = new AuthService(users, encoder, mock(JwtService.class));

        assertThatThrownBy(() -> service.login(new LoginRequest("test@example.fr", "incorrect")))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Identifiants invalides");
    }
}
