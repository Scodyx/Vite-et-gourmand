package fr.vitegourmand.auth.dto;

import jakarta.validation.constraints.*;

public record RegisterRequest(
    @NotBlank String firstName,
    @NotBlank String lastName,
    @NotBlank String phone,
    @Email @NotBlank String email,
    @NotBlank String addressLine,
    @NotBlank String postalCode,
    @NotBlank String city,
    @NotBlank String country,
    @NotBlank @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{10,}$",
        message = "10 caractères minimum avec majuscule, minuscule, chiffre et caractère spécial") String password,
    @AssertTrue(message = "Les conditions doivent être acceptées") boolean termsAccepted
) {}
