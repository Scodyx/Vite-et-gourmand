package fr.vitegourmand.review.controller;
import fr.vitegourmand.review.dto.ReviewDtos.*;
import fr.vitegourmand.review.entity.ModerationStatus;
import fr.vitegourmand.review.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController
public class ReviewController {
 private final ReviewService service;public ReviewController(ReviewService s){service=s;}
 @GetMapping("/api/v1/public/reviews") List<View> approved(){return service.publicApproved();}
 @PostMapping("/api/v1/users/me/orders/{id}/review") @ResponseStatus(HttpStatus.CREATED) View create(Authentication a,@PathVariable Long id,@Valid @RequestBody Create r){return service.create(a.getName(),id,r);}
 @GetMapping("/api/v1/employee/reviews/pending") List<View> pending(){return service.pending();}
 @PatchMapping("/api/v1/employee/reviews/{id}/approve") View approve(Authentication a,@PathVariable Long id){return service.moderate(a.getName(),id,ModerationStatus.APPROVED);}
 @PatchMapping("/api/v1/employee/reviews/{id}/reject") View reject(Authentication a,@PathVariable Long id){return service.moderate(a.getName(),id,ModerationStatus.REJECTED);}
}
