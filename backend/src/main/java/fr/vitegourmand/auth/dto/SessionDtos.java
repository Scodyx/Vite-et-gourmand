package fr.vitegourmand.auth.dto;

import jakarta.validation.constraints.NotBlank;

public final class SessionDtos {
    private SessionDtos() {}

    public record Session(
            String accessToken, String refreshToken, String tokenType, long expiresIn, String role) {}

    public record Refresh(@NotBlank String refreshToken) {}
}
