package fr.vitegourmand.openinghours.repository;
import fr.vitegourmand.openinghours.entity.OpeningHours;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.DayOfWeek;
import java.util.*;
public interface OpeningHoursRepository extends JpaRepository<OpeningHours,Long>{
 List<OpeningHours> findAllByOrderByDisplayOrderAsc();
 Optional<OpeningHours> findByDayOfWeek(DayOfWeek day);
}
