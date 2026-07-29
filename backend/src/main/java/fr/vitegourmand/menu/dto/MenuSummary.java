package fr.vitegourmand.menu.dto;

import java.math.BigDecimal;

public record MenuSummary(
        Long id,
        String title,
        String slug,
        String description,
        String theme,
        String diet,
        int minimumPersons,
        BigDecimal basePrice,
        int availableStock) {}
