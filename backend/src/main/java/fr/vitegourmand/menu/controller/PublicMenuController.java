package fr.vitegourmand.menu.controller;

import fr.vitegourmand.menu.dto.MenuSummary;
import fr.vitegourmand.menu.dto.MenuDetail;
import fr.vitegourmand.menu.repository.MenuRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/public/menus")
public class PublicMenuController {
    private final MenuRepository menus;
    public PublicMenuController(MenuRepository menus) { this.menus = menus; }

    @GetMapping
    public Page<MenuSummary> list(@RequestParam(required=false) String query,@RequestParam(required=false) BigDecimal minPrice,
                                  @RequestParam(required=false) BigDecimal maxPrice,@RequestParam(required=false) String theme,
                                  @RequestParam(required=false) String diet,@RequestParam(required=false) Integer minimumPersons,
                                  Pageable pageable) {
        Specification<fr.vitegourmand.menu.entity.Menu> spec=(root,q,cb)->cb.isTrue(root.get("active"));
        if(query!=null&&!query.isBlank()){String term="%"+query.trim().toLowerCase()+"%";spec=spec.and((r,q,cb)->cb.or(
                cb.like(cb.lower(r.get("title")),term),cb.like(cb.lower(r.get("description")),term)));}
        if(minPrice!=null)spec=spec.and((r,q,cb)->cb.greaterThanOrEqualTo(r.get("basePrice"),minPrice));
        if(maxPrice!=null)spec=spec.and((r,q,cb)->cb.lessThanOrEqualTo(r.get("basePrice"),maxPrice));
        if(theme!=null&&!theme.isBlank())spec=spec.and((r,q,cb)->cb.equal(cb.lower(r.get("theme")),theme.trim().toLowerCase()));
        if(diet!=null&&!diet.isBlank())spec=spec.and((r,q,cb)->cb.equal(cb.lower(r.get("diet")),diet.trim().toLowerCase()));
        if(minimumPersons!=null)spec=spec.and((r,q,cb)->cb.lessThanOrEqualTo(r.get("minimumPersons"),minimumPersons));
        return menus.findAll(spec,pageable).map(m -> new MenuSummary(
                m.getId(), m.getTitle(), m.getSlug(), m.getDescription(), m.getTheme(),
                m.getDiet(), m.getMinimumPersons(), m.getBasePrice(), m.getAvailableStock()));
    }

    @GetMapping("/{slug}")
    @org.springframework.transaction.annotation.Transactional(readOnly=true)
    public MenuDetail detail(@PathVariable String slug) {
        var m = menus.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new fr.vitegourmand.common.exception.NotFoundException("Menu introuvable"));
        return new MenuDetail(m.getId(),m.getTitle(),m.getSlug(),m.getDescription(),m.getConditions(),m.getTheme(),m.getDiet(),
                m.getMinimumPersons(),m.getBasePrice(),m.getAvailableStock(),
                m.getImages().stream().map(i->new MenuDetail.Image(i.getId(),i.getImageUrl(),i.getAltText(),i.getDisplayOrder())).toList(),
                m.getDishes().stream().filter(fr.vitegourmand.dish.entity.Dish::isActive).map(d->new MenuDetail.Dish(d.getId(),d.getName(),d.getDescription(),d.getType(),
                        d.getAllergens().stream().map(a->a.getName()).sorted().toList())).toList());
    }
}
