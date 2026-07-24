package fr.vitegourmand.menu.controller;

import fr.vitegourmand.menu.dto.MenuSummary;
import fr.vitegourmand.menu.repository.MenuRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/menus")
public class PublicMenuController {
    private final MenuRepository menus;
    public PublicMenuController(MenuRepository menus) { this.menus = menus; }

    @GetMapping
    public Page<MenuSummary> list(Pageable pageable) {
        return menus.findByActiveTrue(pageable).map(m -> new MenuSummary(
                m.getId(), m.getTitle(), m.getSlug(), m.getDescription(), m.getTheme(),
                m.getDiet(), m.getMinimumPersons(), m.getBasePrice(), m.getAvailableStock()));
    }

    @GetMapping("/{slug}")
    public MenuSummary detail(@PathVariable String slug) {
        var m = menus.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new fr.vitegourmand.common.exception.NotFoundException("Menu introuvable"));
        return new MenuSummary(m.getId(), m.getTitle(), m.getSlug(), m.getDescription(), m.getTheme(),
                m.getDiet(), m.getMinimumPersons(), m.getBasePrice(), m.getAvailableStock());
    }
}
