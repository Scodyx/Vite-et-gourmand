package fr.vitegourmand.auth.dto;
import jakarta.validation.constraints.*;
public final class PasswordResetDtos {
 private PasswordResetDtos(){}
 public record Forgot(@NotBlank @Email String email){}
 public record Reset(@NotBlank String token,@NotBlank @Size(min=12,max=128)
  @Pattern(regexp="^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$") String password){}
}
