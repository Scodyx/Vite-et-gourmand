package fr.vitegourmand.configuration;

import fr.vitegourmand.security.JwtAuthenticationFilter;
import fr.vitegourmand.user.repository.UserRepository;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfiguration {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    UserDetailsService userDetailsService(UserRepository users) {
        return username ->
                users
                        .findByEmailIgnoreCase(username)
                        .map(
                                account ->
                                        User.withUsername(account.getEmail())
                                                .password(account.getPasswordHash())
                                                .authorities("ROLE_" + account.getRole().name())
                                                .disabled(!account.isEnabled())
                                                .build())
                        .orElseThrow(
                                () ->
                                        new org.springframework.security.core.userdetails.UsernameNotFoundException(
                                                "Utilisateur introuvable"));
    }

    @Bean
    DaoAuthenticationProvider authenticationProvider(
            UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    SecurityFilterChain security(
            HttpSecurity http,
            JwtAuthenticationFilter jwt,
            CorsConfigurationSource corsConfigurationSource,
            DaoAuthenticationProvider authenticationProvider)
            throws Exception {

        return http.csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(
                        session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .exceptionHandling(
                        exceptions ->
                                exceptions
                                        .authenticationEntryPoint(
                                                (request, response, exception) -> {
                                                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                                                    response.setContentType("application/json");
                                response
                                        .getWriter()
                                        .write("{\"message\":\"Authentification requise\"}");
                                                })
                                        .accessDeniedHandler(
                                                (request, response, exception) -> {
                                                    response.setStatus(HttpStatus.FORBIDDEN.value());
                                                    response.setContentType("application/json");
                                                    response.getWriter().write("{\"message\":\"Accès interdit\"}");
                                                }))
                .authorizeHttpRequests(
                        auth ->
                                auth
                                        // Les contrôles CORS OPTIONS doivent passer sans authentification.
                                        .requestMatchers(HttpMethod.OPTIONS, "/**")
                                        .permitAll()
                                        .requestMatchers(
                                        "/api/v1/auth/**",
                                        "/swagger-ui/**",
                                        "/swagger-ui.html",
                                        "/v3/api-docs/**")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.GET, "/api/v1/public/**")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.POST, "/api/v1/public/contact")
                                        .permitAll()
                                        .requestMatchers("/api/v1/admin/**")
                                        .hasRole("ADMIN")
                                        .requestMatchers("/api/v1/employee/**")
                                        .hasAnyRole("EMPLOYEE", "ADMIN")
                                        .anyRequest()
                                        .authenticated())
                .addFilterBefore(jwt, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors-allowed-origin-patterns:" + "http://localhost:*,http://127.0.0.1:*}")
                    String originPatterns) {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOriginPatterns(
                Arrays.stream(originPatterns.split(","))
                        .map(String::trim)
                        .filter(origin -> !origin.isBlank())
                        .toList());

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        configuration.setAllowedHeaders(List.of("*"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
