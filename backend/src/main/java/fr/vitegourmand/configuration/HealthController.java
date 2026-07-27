package fr.vitegourmand.configuration;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/api/v1/public/health")
    Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
