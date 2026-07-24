package fr.vitegourmand.auth.service;

import fr.vitegourmand.auth.dto.RegisterRequest;
import fr.vitegourmand.security.JwtService;
import fr.vitegourmand.user.entity.Role;
import fr.vitegourmand.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;
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
}
