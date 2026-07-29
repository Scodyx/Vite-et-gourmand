package fr.vitegourmand.statistics.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public final class StatisticsDtos {
    private StatisticsDtos() {}

    public record MenuStat(
            Long menuId,
            String menuTitle,
            LocalDate date,
            long orderCount,
            BigDecimal grossRevenue,
            BigDecimal discountTotal,
            BigDecimal deliveryRevenue,
            BigDecimal totalRevenue) {}

    public record Summary(
            long orderCount,
            BigDecimal grossRevenue,
            BigDecimal discountTotal,
            BigDecimal deliveryRevenue,
            BigDecimal totalRevenue) {}
}
