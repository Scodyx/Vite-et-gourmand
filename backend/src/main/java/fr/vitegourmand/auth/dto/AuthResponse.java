package fr.vitegourmand.auth.dto;

public record AuthResponse(String accessToken, String tokenType, long expiresIn, String role) {}
