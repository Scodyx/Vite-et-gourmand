package fr.vitegourmand.user.controller;

import fr.vitegourmand.user.dto.UserDtos.Update;
import fr.vitegourmand.user.dto.UserDtos.View;
import fr.vitegourmand.user.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me")
public class UserProfileController {
    private final UserProfileService service;

    public UserProfileController(UserProfileService service) {
        this.service = service;
    }

    @GetMapping
    View get(Authentication a) {
        return service.get(a.getName());
    }

    @PutMapping
    View update(Authentication a, @Valid @RequestBody Update r) {
        return service.update(a.getName(), r);
    }
}
