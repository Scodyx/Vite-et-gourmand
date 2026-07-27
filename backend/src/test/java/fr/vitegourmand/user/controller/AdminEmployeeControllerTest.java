package fr.vitegourmand.user.controller;

import fr.vitegourmand.common.exception.BusinessException;
import fr.vitegourmand.common.exception.NotFoundException;
import fr.vitegourmand.user.entity.Role;
import fr.vitegourmand.user.entity.User;
import fr.vitegourmand.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdminEmployeeControllerTest {
    private final UserRepository users = mock(UserRepository.class);
    private final PasswordEncoder passwords = mock(PasswordEncoder.class);
    private final AdminEmployeeController controller = new AdminEmployeeController(users, passwords);

    @Test void creationNormalizesEmailHashesPasswordAndForcesEmployeeRole() {
        when(passwords.encode("Strong-Password1!")).thenReturn("bcrypt");
        when(users.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        controller.create(new AdminEmployeeController.Create(
                " Alice ", " Martin ", " Alice@Example.TEST ", "Strong-Password1!", null));

        var saved = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        assertThat(saved.getValue().getEmail()).isEqualTo("alice@example.test");
        assertThat(saved.getValue().getPasswordHash()).isEqualTo("bcrypt");
        assertThat(saved.getValue().getRole()).isEqualTo(Role.EMPLOYEE);
    }

    @Test void duplicateEmailIsRejected() {
        when(users.existsByEmailIgnoreCase("duplicate@example.test")).thenReturn(true);
        assertThatThrownBy(() -> controller.create(new AdminEmployeeController.Create(
                "A", "B", "duplicate@example.test", "Strong-Password1!", null)))
                .isInstanceOf(BusinessException.class);
        verify(users, never()).save(any());
    }

    @Test void employeeCanBeDisabledAndReactivated() {
        var employee = new User(); employee.setRole(Role.EMPLOYEE); employee.setEnabled(true);
        when(users.findById(4L)).thenReturn(Optional.of(employee));
        assertThat(controller.enabled(4L, false).enabled()).isFalse();
        assertThat(controller.enabled(4L, true).enabled()).isTrue();
    }

    @Test void endpointCannotDisableNonEmployee() {
        var admin = new User(); admin.setRole(Role.ADMIN);
        when(users.findById(1L)).thenReturn(Optional.of(admin));
        assertThatThrownBy(() -> controller.enabled(1L, false)).isInstanceOf(NotFoundException.class);
    }
}
