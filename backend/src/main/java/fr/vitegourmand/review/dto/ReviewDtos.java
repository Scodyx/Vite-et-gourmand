package fr.vitegourmand.review.dto;

import fr.vitegourmand.review.entity.ModerationStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class ReviewDtos {
    private ReviewDtos() {}

    public record Create(
            @Min(1) @Max(5) int rating, @NotBlank @Size(min = 10, max = 2000) String comment) {}

    public record View(
            Long id,
            Long orderId,
            String menuTitle,
            String customerFirstName,
            int rating,
            String comment,
            ModerationStatus status,
            Instant createdAt) {}
}
