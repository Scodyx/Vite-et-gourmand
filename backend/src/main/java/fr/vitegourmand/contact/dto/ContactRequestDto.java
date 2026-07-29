package fr.vitegourmand.contact.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactRequestDto(
        @Email @NotBlank String email,
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(min = 10, max = 5000) String message) {}
