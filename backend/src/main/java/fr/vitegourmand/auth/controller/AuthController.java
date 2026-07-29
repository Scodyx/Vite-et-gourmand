package fr.vitegourmand.auth.controller;

import fr.vitegourmand.auth.dto.LoginRequest;
import fr.vitegourmand.auth.dto.PasswordResetDtos;
import fr.vitegourmand.auth.dto.RegisterRequest;
import fr.vitegourmand.auth.dto.SessionDtos;
import fr.vitegourmand.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService auth;
    private final fr.vitegourmand.auth.service.PasswordResetService passwordReset;
    private final fr.vitegourmand.auth.service.RefreshTokenService refreshTokens;

    public AuthController(
            AuthService auth,
            fr.vitegourmand.auth.service.PasswordResetService passwordReset,
            fr.vitegourmand.auth.service.RefreshTokenService refreshTokens) {
        this.auth = auth;
        this.passwordReset = passwordReset;
        this.refreshTokens = refreshTokens;
    }

    @PostMapping("/register")
    ResponseEntity<SessionDtos.Session> register(@Valid @RequestBody RegisterRequest request) {
        auth.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(refreshTokens.issue(request.email()));
    }

    @PostMapping("/login")
    SessionDtos.Session login(@Valid @RequestBody LoginRequest request) {
        auth.login(request);
        return refreshTokens.issue(request.email());
    }

    @PostMapping("/refresh")
    SessionDtos.Session refresh(@Valid @RequestBody SessionDtos.Refresh request) {
        return refreshTokens.rotate(request.refreshToken());
    }

    @PostMapping("/logout")
    ResponseEntity<Void> logout(@Valid @RequestBody SessionDtos.Refresh request) {
        refreshTokens.revoke(request.refreshToken());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgot-password")
    ResponseEntity<Void> forgot(@Valid @RequestBody PasswordResetDtos.Forgot request) {
        passwordReset.forgot(request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/reset-password")
    ResponseEntity<Void> reset(@Valid @RequestBody PasswordResetDtos.Reset request) {
        passwordReset.reset(request);
        return ResponseEntity.noContent().build();
    }
}
