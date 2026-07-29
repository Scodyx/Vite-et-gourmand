package fr.vitegourmand.order.controller;

import fr.vitegourmand.common.exception.InvalidRequestException;
import fr.vitegourmand.order.dto.OrderDtos.Cancellation;
import fr.vitegourmand.order.dto.OrderDtos.Create;
import fr.vitegourmand.order.dto.OrderDtos.Detail;
import fr.vitegourmand.order.dto.OrderDtos.EmployeeDetail;
import fr.vitegourmand.order.dto.OrderDtos.EmployeePage;
import fr.vitegourmand.order.dto.OrderDtos.EmployeeQuery;
import fr.vitegourmand.order.dto.OrderDtos.Transition;
import fr.vitegourmand.order.dto.OrderDtos.Update;
import fr.vitegourmand.order.dto.OrderDtos.View;

import fr.vitegourmand.order.entity.OrderStatus;
import fr.vitegourmand.order.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrderController {
    private final OrderService service;

    public OrderController(OrderService service) {
        this.service = service;
    }

    @PostMapping("/api/v1/orders")
    ResponseEntity<View> create(Authentication a, @Valid @RequestBody Create r) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(a.getName(), r));
    }

    @GetMapping("/api/v1/orders")
    Page<View> mine(Authentication a, @PageableDefault(size = 20) Pageable p) {
        return service.mine(a.getName(), p);
    }

    @GetMapping("/api/v1/users/me/orders")
    Page<View> mineAlias(Authentication a, @PageableDefault(size = 20) Pageable p) {
        return service.mine(a.getName(), p);
    }

    @GetMapping("/api/v1/users/me/orders/{id}")
    Detail mineDetail(Authentication a, @PathVariable Long id) {
        return service.mineDetail(a.getName(), id);
    }

    @PutMapping("/api/v1/users/me/orders/{id}")
    View update(Authentication a, @PathVariable Long id, @Valid @RequestBody Update r) {
        return service.updateMine(a.getName(), id, r);
    }

    @PostMapping("/api/v1/orders/{id}/cancel")
    View cancel(Authentication a, @PathVariable Long id, @Valid @RequestBody Cancellation r) {
        return service.cancelMine(a.getName(), id, r);
    }

    @PatchMapping("/api/v1/users/me/orders/{id}/cancel")
    View cancelAlias(Authentication a, @PathVariable Long id, @Valid @RequestBody Cancellation r) {
        return service.cancelMine(a.getName(), id, r);
    }

    @GetMapping("/api/v1/employee/orders")
    EmployeePage all(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "serviceDate") String sort,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    java.time.LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    java.time.LocalDate dateTo,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean today,
            @RequestParam(defaultValue = "false") boolean upcoming) {
        OrderStatus parsedStatus = null;
        if (status != null && !status.isBlank())
            try {
                parsedStatus = OrderStatus.valueOf(status);
            } catch (IllegalArgumentException exception) {
                throw new InvalidRequestException("Statut inconnu");
            }
        return service.all(
                new EmployeeQuery(
                        page, size, sort, direction, parsedStatus, dateFrom, dateTo, search, today, upcoming));
    }

    @GetMapping("/api/v1/employee/orders/{id}")
    EmployeeDetail detail(@PathVariable Long id) {
        return service.employeeDetail(id);
    }

    @PatchMapping("/api/v1/employee/orders/{id}/status")
    View transition(Authentication a, @PathVariable Long id, @Valid @RequestBody Transition r) {
        return service.transition(a.getName(), id, r);
    }

    @PatchMapping("/api/v1/employee/orders/{id}/cancel")
    View employeeCancel(Authentication a, @PathVariable Long id, @Valid @RequestBody Cancellation r) {
        return service.cancelEmployee(a.getName(), id, r);
    }
}
