package fr.vitegourmand.user.dto;

import fr.vitegourmand.user.entity.Role;
import jakarta.validation.constraints.NotBlank;

public final class UserDtos {
    private UserDtos() {}

    public record View(
            Long id,
            String email,
            String firstName,
            String lastName,
            String phone,
            String addressLine,
            String postalCode,
            String city,
            String country,
            Role role) {}

    public record Update(
            @NotBlank String firstName,
            @NotBlank String lastName,
            String phone,
            @NotBlank String addressLine,
            @NotBlank String postalCode,
            @NotBlank String city,
            @NotBlank String country) {}
}
