package fr.vitegourmand.order.service;

import fr.vitegourmand.common.exception.BusinessException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Service;

@Service
public class OrderPricingService {
    private static final BigDecimal DELIVERY_BASE = new BigDecimal("5.00");
    private static final BigDecimal DELIVERY_PER_KM = new BigDecimal("0.59");
    private static final BigDecimal DISCOUNT_RATE = new BigDecimal("0.10");

    public PriceBreakdown calculate(
            BigDecimal basePrice,
            int minimumPersons,
            int personCount,
            boolean outsideBordeaux,
            BigDecimal distanceKm) {
        if (minimumPersons <= 0 || personCount < minimumPersons) {
            throw new BusinessException("Le nombre de personnes est inférieur au minimum du menu");
        }
        if (basePrice == null
                || basePrice.signum() < 0
                || distanceKm == null
                || distanceKm.signum() < 0) {
            throw new BusinessException("Le prix et la distance doivent être positifs");
        }
        var unitPrice = basePrice.divide(BigDecimal.valueOf(minimumPersons), 6, RoundingMode.HALF_UP);
        var menuAmount = money(unitPrice.multiply(BigDecimal.valueOf(personCount)));
        var discount =
                personCount >= minimumPersons + 5
                        ? money(menuAmount.multiply(DISCOUNT_RATE))
                        : BigDecimal.ZERO.setScale(2);
        var delivery =
                outsideBordeaux
                        ? money(DELIVERY_BASE.add(DELIVERY_PER_KM.multiply(distanceKm)))
                        : BigDecimal.ZERO.setScale(2);
        return new PriceBreakdown(
                menuAmount, discount, delivery, money(menuAmount.subtract(discount).add(delivery)));
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    public record PriceBreakdown(
            BigDecimal menuAmount,
            BigDecimal discountAmount,
            BigDecimal deliveryAmount,
            BigDecimal totalAmount) {}
}
