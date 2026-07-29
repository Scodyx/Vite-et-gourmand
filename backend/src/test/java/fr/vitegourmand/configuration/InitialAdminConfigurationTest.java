package fr.vitegourmand.configuration;

import fr.vitegourmand.user.entity.Role;
import fr.vitegourmand.user.entity.User;
import fr.vitegourmand.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.concurrent.atomic.AtomicReference;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class InitialAdminConfigurationTest {
 private final InitialAdminConfiguration configuration=new InitialAdminConfiguration();
 private final UserRepository users=mock(UserRepository.class);
 private final PasswordEncoder passwords=mock(PasswordEncoder.class);
 @Test void absentExplicitConfigurationCreatesNothing() throws Exception{
  runner(false,"","").run(null);verifyNoInteractions(users,passwords);
 }
 @Test void explicitConfigurationCreatesNormalizedAdminWithHashedPassword() throws Exception{
  when(users.existsByEmailIgnoreCase("admin@example.test")).thenReturn(false);
  when(passwords.encode("Temporary-Smoke-Password!")).thenReturn("bcrypt-hash");
  var saved=new AtomicReference<User>();when(users.save(any())).thenAnswer(call->{saved.set(call.getArgument(0));return call.getArgument(0);});
  runner(true," Admin@Example.TEST ","Temporary-Smoke-Password!").run(null);
  assertThat(saved.get().getEmail()).isEqualTo("admin@example.test");assertThat(saved.get().getRole()).isEqualTo(Role.ADMIN);
  assertThat(saved.get().getPasswordHash()).isEqualTo("bcrypt-hash");verify(passwords).encode("Temporary-Smoke-Password!");
 }
 @Test void existingAccountIsNeverModified() throws Exception{
  when(users.existsByEmailIgnoreCase("admin@example.test")).thenReturn(true);
  runner(true,"admin@example.test","Temporary-Smoke-Password!").run(null);
  verify(users,never()).save(any());verifyNoInteractions(passwords);
 }
 private ApplicationRunner runner(boolean enabled,String email,String password){
  return configuration.initialAdmin(users,passwords,enabled,email,password,"Admin","Smoke");
 }
}
