package fr.vitegourmand.auth.service;

import fr.vitegourmand.auth.entity.RefreshToken;
import fr.vitegourmand.auth.repository.RefreshTokenRepository;
import fr.vitegourmand.common.exception.BusinessException;
import fr.vitegourmand.security.JwtService;
import fr.vitegourmand.user.entity.Role;
import fr.vitegourmand.user.entity.User;
import fr.vitegourmand.user.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RefreshTokenServiceTest {
    @Test void rotationRevokesPreviousTokenAndIssuesAnotherOne() {
        var tokens = mock(RefreshTokenRepository.class);
        var jwt = mock(JwtService.class);
        var user = enabledUser();
        var current = RefreshToken.create("hash", user, Instant.now().plusSeconds(60));
        when(tokens.findByTokenHash(any())).thenReturn(Optional.of(current));
        when(jwt.generate(user)).thenReturn("access");
        var service = new RefreshTokenService(tokens, mock(UserRepository.class), jwt, 60_000);

        var session = service.rotate("raw-refresh-token");

        assertThat(current.getRevokedAt()).isNotNull();
        assertThat(session.accessToken()).isEqualTo("access");
        assertThat(session.refreshToken()).isNotBlank().isNotEqualTo("raw-refresh-token");
        verify(tokens).save(any(RefreshToken.class));
    }

    @Test void expiredRefreshTokenIsRejected() {
        var tokens = mock(RefreshTokenRepository.class);
        var expired = RefreshToken.create("hash", enabledUser(), Instant.now().minusSeconds(1));
        when(tokens.findByTokenHash(any())).thenReturn(Optional.of(expired));
        var service = new RefreshTokenService(tokens, mock(UserRepository.class), mock(JwtService.class), 60_000);

        assertThatThrownBy(() -> service.rotate("expired"))
                .isInstanceOf(BusinessException.class);
        verify(tokens, never()).save(any());
    }

    @Test void disabledAccountCannotRotateRefreshToken() {
        var tokens = mock(RefreshTokenRepository.class);
        var user = enabledUser();
        user.setEnabled(false);
        when(tokens.findByTokenHash(any())).thenReturn(Optional.of(
                RefreshToken.create("hash", user, Instant.now().plusSeconds(60))));
        var service = new RefreshTokenService(tokens, mock(UserRepository.class), mock(JwtService.class), 60_000);

        assertThatThrownBy(() -> service.rotate("raw"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Compte désactivé");
    }

    private User enabledUser() {
        var user = new User();
        user.setEnabled(true);
        user.setRole(Role.USER);
        return user;
    }
}
