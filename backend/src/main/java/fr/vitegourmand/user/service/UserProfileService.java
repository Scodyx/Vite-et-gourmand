package fr.vitegourmand.user.service;

import fr.vitegourmand.common.exception.NotFoundException;
import fr.vitegourmand.user.dto.UserDtos.Update;
import fr.vitegourmand.user.dto.UserDtos.View;
import fr.vitegourmand.user.entity.User;
import fr.vitegourmand.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {
    private final UserRepository users;

    public UserProfileService(UserRepository users) {
        this.users = users;
    }

    @Transactional(readOnly = true)
    public View get(String email) {
        return view(user(email));
    }

    @Transactional
    public View update(String email, Update request) {
        var user = user(email);
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setPhone(request.phone());
        user.setAddressLine(request.addressLine().trim());
        user.setPostalCode(request.postalCode().trim());
        user.setCity(request.city().trim());
        user.setCountry(request.country().trim());
        return view(user);
    }

    private User user(String email) {
        return users
                .findByEmailIgnoreCase(email)
                .filter(User::isEnabled)
                .orElseThrow(() -> new NotFoundException("Utilisateur introuvable"));
    }

    private View view(User user) {
        return new View(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getAddressLine(),
                user.getPostalCode(),
                user.getCity(),
                user.getCountry(),
                user.getRole());
    }
}
