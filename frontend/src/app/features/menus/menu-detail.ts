import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Menu } from '../../core/models/menu';
import { MenuService } from '../../core/services/menu.service';
@Component({
 standalone: true, selector: 'app-menu-detail', imports: [RouterLink],
 template: `<div class="container section">@if (menu(); as m) {<p class="eyebrow">{{m.theme}} · {{m.diet}}</p><h1>{{m.title}}</h1>
 <div class="detail-grid"><div class="detail-image" role="img" [attr.aria-label]="'Présentation de '+m.title"></div><div><p>{{m.description}}</p>
 <div class="conditions"><h2>Conditions de commande</h2><p>Commande anticipée requise. Minimum {{m.minimumPersons}} personnes. Stock : {{m.availableStock}}.</p></div>
 <p class="price">{{m.basePrice}} € <small>pour {{m.minimumPersons}} personnes</small></p>
 <a class="button" [routerLink]="['/commande',m.slug]">Commander ce menu</a></div></div>} @else {<p>Chargement…</p>}</div>`
})
export class MenuDetailComponent implements OnInit {
 readonly menu = signal<Menu | null>(null);
 constructor(private route: ActivatedRoute, private api: MenuService) {}
 ngOnInit() { this.api.detail(this.route.snapshot.paramMap.get('slug')!).subscribe(m => this.menu.set(m)); }
}
