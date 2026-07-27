package fr.vitegourmand.user.controller;
import fr.vitegourmand.common.exception.*;
import fr.vitegourmand.user.entity.*;
import fr.vitegourmand.user.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import fr.vitegourmand.common.email.ApplicationEmailService;
@RestController @RequestMapping("/api/v1/admin/employees")
public class AdminEmployeeController {
 private final UserRepository users;private final PasswordEncoder passwords;
 @Autowired(required=false) private ApplicationEmailService emails;
 public AdminEmployeeController(UserRepository u,PasswordEncoder p){users=u;passwords=p;}
 public record Create(@NotBlank String firstName,@NotBlank String lastName,@NotBlank @Email String email,
  @NotBlank @Size(min=12) @Pattern(regexp="^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$") String temporaryPassword,String phone){}
 public record View(Long id,String firstName,String lastName,String email,String phone,Role role,boolean enabled,java.time.Instant createdAt){
  static View from(User u){return new View(u.getId(),u.getFirstName(),u.getLastName(),u.getEmail(),u.getPhone(),u.getRole(),u.isEnabled(),u.getCreatedAt());}}
 @GetMapping List<View> all(){return users.findAll().stream().filter(u->u.getRole()==Role.EMPLOYEE).map(View::from).toList();}
 @PostMapping @ResponseStatus(HttpStatus.CREATED) @Transactional View create(@Valid @RequestBody Create r){
  if(users.existsByEmailIgnoreCase(r.email()))throw new BusinessException("Cette adresse e-mail est déjà utilisée");
  var u=new User();u.setFirstName(r.firstName().trim());u.setLastName(r.lastName().trim());u.setEmail(r.email().trim().toLowerCase(Locale.ROOT));
  u.setPhone(r.phone());u.setPasswordHash(passwords.encode(r.temporaryPassword()));u.setRole(Role.EMPLOYEE);var saved=users.save(u);
  if(emails!=null)emails.employeeCreated(saved.getEmail(),saved.getFirstName());return View.from(saved);}
 @PatchMapping("/{id}/enabled") @Transactional View enabled(@PathVariable Long id,@RequestParam boolean value){
  var u=users.findById(id).filter(x->x.getRole()==Role.EMPLOYEE).orElseThrow(()->new NotFoundException("Employé introuvable"));
  u.setEnabled(value);return View.from(u);}
}
