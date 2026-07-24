package fr.vitegourmand.statistics.repository;
import fr.vitegourmand.statistics.document.MenuStatisticsDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDate;
import java.util.List;
public interface MenuStatisticsRepository extends MongoRepository<MenuStatisticsDocument,String>{
 List<MenuStatisticsDocument> findByStatisticsDateBetweenOrderByTotalRevenueDesc(LocalDate from,LocalDate to);
}
