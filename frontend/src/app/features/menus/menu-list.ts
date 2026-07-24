import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Menu } from '../../core/models/menu';
import { MenuService } from '../../core/services/menu.service';
@Component({
  standalone: true, selector: 'app-menu-list', imports: [FormsModule, RouterLink],
  template: `<section class="page-heading"><div class="container"><p class="eyebrow">La carte</p><h1>Nos menus</h1><p>Choisissez une formule pensée pour votre événement.</p></div></section>
  <div class="container content-grid"><aside class="filters" aria-label="Filtres des menus"><h2>Filtrer</h2>
  <label>Recherche <input [(ngModel)]="query" placeholder="Nom, thème…"></label>
  <label>Budget maximum <input type="number" [(ngModel)]="maxPrice" min="0"></label></aside>
  <section aria-live="polite"><p>{{filtered().length}} menu(s)</p><div class="cards">
  @for (menu of filtered(); track menu.id) { <article class="menu-card"><div class="menu-image" role="img" aria-label="Présentation du menu"></div>
  <div><span class="tag">{{menu.theme}}</span><h2>{{menu.title}}</h2><p>{{menu.description}}</p>
  <dl><div><dt>À partir de</dt><dd>{{menu.basePrice}} € / {{menu.minimumPersons}} pers.</dd></div><div><dt>Régime</dt><dd>{{menu.diet}}</dd></div></dl>
  <a class="button secondary" [routerLink]="['/menus', menu.slug]">Voir le menu</a></div></article> }
  @if (error()) { <p class="alert error">{{error()}}</p> }</div></section></div>`
})
export class MenuListComponent implements OnInit {
  readonly menus = signal<Menu[]>([]); readonly error = signal(''); query = ''; maxPrice: number | null = null;
  readonly filtered = computed(() => this.menus().filter(m =>
    (!this.query || `${m.title} ${m.theme} ${m.diet}`.toLowerCase().includes(this.query.toLowerCase())) &&
    (!this.maxPrice || m.basePrice <= this.maxPrice)));
  constructor(private menusApi: MenuService) {}
  ngOnInit() { this.menusApi.list().subscribe({ next: p => this.menus.set(p.content), error: () => this.error.set('Les menus sont momentanément indisponibles.') }); }
}
