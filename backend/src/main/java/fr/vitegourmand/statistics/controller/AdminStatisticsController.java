package fr.vitegourmand.statistics.controller;

import fr.vitegourmand.statistics.dto.StatisticsDtos.MenuStat;
import fr.vitegourmand.statistics.dto.StatisticsDtos.Summary;
import fr.vitegourmand.statistics.service.StatisticsService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/statistics")
public class AdminStatisticsController {
    private final StatisticsService service;

    public AdminStatisticsController(StatisticsService service) {
        this.service = service;
    }

    @PostMapping("/rebuild")
    List<MenuStat> rebuild() {
        return service.rebuild();
    }

    @GetMapping("/menus")
    List<MenuStat> menus(
            @RequestParam(required = false) Long menuId,
            @RequestParam(defaultValue = "2000-01-01") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate from,
            @RequestParam(defaultValue = "2100-12-31") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate to) {
        return service.menus(from, to, menuId);
    }

    @GetMapping("/revenue")
    Summary revenue(
            @RequestParam(defaultValue = "2000-01-01") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate from,
            @RequestParam(defaultValue = "2100-12-31") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate to) {
        return service.summary(from, to);
    }
}
