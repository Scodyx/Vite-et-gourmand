package fr.vitegourmand.statistics.document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("menu_statistics")
@CompoundIndex(name = "menu_period_unique", def = "{'menuId':1,'statisticsDate':1}", unique = true)
public record MenuStatisticsDocument(
        @Id String id,
        Long menuId,
        String menuTitle,
        long orderCount,
        BigDecimal grossRevenue,
        BigDecimal discountTotal,
        BigDecimal deliveryRevenue,
        BigDecimal totalRevenue,
        LocalDate statisticsDate,
        Instant updatedAt) {}
