package fr.vitegourmand.configuration;

import fr.vitegourmand.user.entity.User;
import fr.vitegourmand.user.repository.UserRepository;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class InitialAdminConfiguration {

    @Bean
    ApplicationRunner initialAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap-admin.enabled}") boolean enabled,
            @Value("${app.bootstrap-admin.email}") String email,
            @Value("${app.bootstrap-admin.password}") String password,
            @Value("${app.bootstrap-admin.first-name}") String firstName,
            @Value("${app.bootstrap-admin.last-name}") String lastName) {
        return args -> {
            String normalizedEmail = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
            if (!enabled
                    || normalizedEmail.isBlank()
                    || password == null
                    || password.isBlank()
                    || userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                return;
            }

            User admin = new User();

            admin.setEmail(normalizedEmail);
            admin.setPasswordHash(passwordEncoder.encode(password));
            admin.setFirstName(firstName);
            admin.setLastName(lastName);

            // Nom complet utilisé pour éviter le conflit avec
            // org.springframework.context.annotation.Role
            admin.setRole(fr.vitegourmand.user.entity.Role.ADMIN);

            userRepository.save(admin);
        };
    }
}
