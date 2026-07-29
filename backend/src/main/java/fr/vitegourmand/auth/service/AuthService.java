package fr.vitegourmand.auth.service;

import fr.vitegourmand.auth.dto.AuthResponse;
import fr.vitegourmand.auth.dto.LoginRequest;
import fr.vitegourmand.auth.dto.RegisterRequest;
import fr.vitegourmand.common.email.ApplicationEmailService;
import fr.vitegourmand.common.exception.AuthenticationException;
import fr.vitegourmand.common.exception.BusinessException;
import fr.vitegourmand.security.JwtService;
import fr.vitegourmand.user.entity.Role;
import fr.vitegourmand.user.entity.User;
import fr.vitegourmand.user.repository.UserRepository;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final JwtService jwt;

    @Autowired(required = false)
    private ApplicationEmailService emails;

    public AuthService(UserRepository users, PasswordEncoder passwords, JwtService jwt) {
        this.users = users;
        this.passwords = passwords;
        this.jwt = jwt;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        var email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCase(email))
            throw new BusinessException("Cette adresse e-mail est déjà utilisée");
        var user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwords.encode(request.password()));
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setPhone(request.phone());
        user.setAddressLine(request.addressLine());
        user.setPostalCode(request.postalCode());
        user.setCity(request.city());
        user.setCountry(request.country());
        user.setRole(Role.USER);
        users.save(user);
        if (emails != null) emails.welcome(user.getEmail(), user.getFirstName());
        return token(user);
    }

    public AuthResponse login(LoginRequest request) {
        var user =
                users
                        .findByEmailIgnoreCase(request.email())
                        .filter(User::isEnabled)
                        .orElseThrow(() -> new AuthenticationException("Identifiants invalides"));
        if (!passwords.matches(request.password(), user.getPasswordHash()))
            throw new AuthenticationException("Identifiants invalides");
        return token(user);
    }

    private AuthResponse token(User user) {
        return new AuthResponse(
                jwt.generate(user), "Bearer", jwt.expirationSeconds(), user.getRole().name());
    }
}
