package fr.vitegourmand.openinghours.repository;

import fr.vitegourmand.openinghours.entity.OpeningHours;
import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OpeningHoursRepository extends JpaRepository<OpeningHours, Long> {
    List<OpeningHours> findAllByOrderByDisplayOrderAsc();

    Optional<OpeningHours> findByDayOfWeek(DayOfWeek day);
}
