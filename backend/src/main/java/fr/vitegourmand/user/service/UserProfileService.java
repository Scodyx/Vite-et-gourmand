package fr.vitegourmand.user.service;
import fr.vitegourmand.common.exception.NotFoundException;
import fr.vitegourmand.user.dto.UserDtos.*;
import fr.vitegourmand.user.entity.User;
import fr.vitegourmand.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class UserProfileService {
 private final UserRepository users;public UserProfileService(UserRepository u){users=u;}
 @Transactional(readOnly=true) public View get(String email){return view(user(email));}
 @Transactional public View update(String email,Update r){var u=user(email);u.setFirstName(r.firstName().trim());u.setLastName(r.lastName().trim());
  u.setPhone(r.phone());u.setAddressLine(r.addressLine().trim());u.setPostalCode(r.postalCode().trim());u.setCity(r.city().trim());u.setCountry(r.country().trim());return view(u);}
 private User user(String email){return users.findByEmailIgnoreCase(email).filter(User::isEnabled).orElseThrow(()->new NotFoundException("Utilisateur introuvable"));}
 private View view(User u){return new View(u.getId(),u.getEmail(),u.getFirstName(),u.getLastName(),u.getPhone(),u.getAddressLine(),u.getPostalCode(),u.getCity(),u.getCountry(),u.getRole());}
}
