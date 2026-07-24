package fr.vitegourmand.configuration;

import fr.vitegourmand.user.entity.*;
import fr.vitegourmand.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.*;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("dev")
public class InitialAdminConfiguration {
    @Bean ApplicationRunner initialAdmin(UserRepository users, PasswordEncoder passwords,
        @Value("${app.bootstrap-admin.enabled}") boolean enabled,
        @Value("${app.bootstrap-admin.email}") String email,
        @Value("${app.bootstrap-admin.password}") String password,
        @Value("${app.bootstrap-admin.first-name}") String firstName,
        @Value("${app.bootstrap-admin.last-name}") String lastName) {
        return args -> {
            if (!enabled || email.isBlank() || password.isBlank() || users.existsByEmailIgnoreCase(email)) return;
            var admin = new User();
            admin.setEmail(email.toLowerCase()); admin.setPasswordHash(passwords.encode(password));
            admin.setFirstName(firstName); admin.setLastName(lastName); admin.setRole(Role.ADMIN);
            users.save(admin);
        };
    }
}
