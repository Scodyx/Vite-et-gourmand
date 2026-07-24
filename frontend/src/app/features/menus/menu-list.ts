import { Component,OnInit,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Menu } from '../../core/models/menu';
import { MenuService } from '../../core/services/menu.service';
@Component({standalone:true,selector:'app-menu-list',imports:[FormsModule,RouterLink],template:`
<section class="page-heading"><div class="container"><p class="eyebrow">La carte</p><h1>Nos menus</h1>
<p>Choisissez une formule pensée pour votre événement.</p></div></section>
<div class="container content-grid"><aside class="filters" aria-label="Filtres des menus"><h2>Filtrer</h2>
<label>Recherche <input [(ngModel)]="query" placeholder="Nom, description…"></label>
<label>Budget maximum <input type="number" [(ngModel)]="maxPrice" min="0"></label>
<label>Thème <input [(ngModel)]="theme"></label><label>Régime <input [(ngModel)]="diet"></label>
<button class="button small" (click)="load()">Appliquer les filtres</button></aside>
<section aria-live="polite">@if(loading()){<p>Chargement…</p>}@else{<p>{{menus().length}} menu(s)</p>}
@if(error()){<p class="alert error">{{error()}}</p>}<div class="cards">
@for(menu of menus();track menu.id){<article class="menu-card"><div class="menu-image" role="img" [attr.aria-label]="'Présentation de '+menu.title"></div>
<div><span class="tag">{{menu.theme}}</span><h2>{{menu.title}}</h2><p>{{menu.description}}</p>
<dl><div><dt>À partir de</dt><dd>{{menu.basePrice}} € / {{menu.minimumPersons}} pers.</dd></div>
<div><dt>Régime</dt><dd>{{menu.diet}}</dd></div><div><dt>Stock</dt><dd>{{menu.availableStock}} personnes</dd></div></dl>
<a class="button secondary" [routerLink]="['/menus',menu.slug]">Voir le détail</a></div></article>}
@empty{ @if(!loading()&&!error()){<p>Aucun menu ne correspond aux filtres.</p>} }</div></section></div>`})
export class MenuListComponent implements OnInit{
 readonly menus=signal<Menu[]>([]);readonly error=signal('');readonly loading=signal(false);
 query='';maxPrice:number|null=null;theme='';diet='';
 constructor(private api:MenuService){}ngOnInit(){this.load();}
 load(){this.loading.set(true);this.error.set('');this.api.list({query:this.query,maxPrice:this.maxPrice??undefined,theme:this.theme,diet:this.diet}).subscribe({
  next:p=>{this.menus.set(p.content);this.loading.set(false);},error:()=>{this.error.set('Les menus sont momentanément indisponibles.');this.loading.set(false);}});}
}
