package fr.vitegourmand.statistics.repository;

import fr.vitegourmand.statistics.document.MenuStatisticsDocument;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface MenuStatisticsRepository extends MongoRepository<MenuStatisticsDocument, String> {
    List<MenuStatisticsDocument> findByStatisticsDateBetweenOrderByTotalRevenueDesc(
            LocalDate from, LocalDate to);
}
