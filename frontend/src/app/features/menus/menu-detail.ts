import { Component,OnInit,signal } from '@angular/core';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MenuDetail } from '../../core/models/menu';
import { MenuService } from '../../core/services/menu.service';
@Component({standalone:true,selector:'app-menu-detail',imports:[RouterLink],template:`
<div class="container section">@if(menu();as m){<p class="eyebrow">{{m.theme}} · {{m.diet}}</p><h1>{{m.title}}</h1>
<div class="detail-grid"><div>@for(image of m.images;track image.id){<img class="detail-photo" [src]="image.url" [alt]="image.altText">}
@empty{<div class="detail-image" role="img" [attr.aria-label]="'Présentation de '+m.title"></div>}</div>
<div><p>{{m.description}}</p><div class="conditions"><h2>Conditions de commande</h2><p>{{m.conditions}}</p>
<p>Minimum {{m.minimumPersons}} personnes · Stock {{m.availableStock}} personnes.</p></div>
<p class="price">{{m.basePrice}} € <small>pour {{m.minimumPersons}} personnes</small></p>
<a class="button" [routerLink]="['/commande',m.slug]">Commander ce menu</a></div></div>
<section><h2>Composition</h2><div class="three">@for(dish of m.dishes;track dish.id){<article class="card"><span class="tag">{{label(dish.type)}}</span>
<h3>{{dish.name}}</h3><p>{{dish.description}}</p>@if(dish.allergens.length){<p><strong>Allergènes :</strong> {{dish.allergens.join(', ')}}</p>}</article>}</div></section>}
@else if(error()){<p class="alert error">{{error()}}</p>}@else{<p>Chargement…</p>}</div>`})
export class MenuDetailComponent implements OnInit{
 readonly menu=signal<MenuDetail|null>(null);readonly error=signal('');
 constructor(private route:ActivatedRoute,private api:MenuService){}
 ngOnInit(){this.api.detail(this.route.snapshot.paramMap.get('slug')!).subscribe({next:m=>this.menu.set(m),error:()=>this.error.set('Ce menu est introuvable ou indisponible.')});}
 label(type:string){return ({ENTRY:'Entrée',MAIN_COURSE:'Plat',DESSERT:'Dessert'} as Record<string,string>)[type]??type;}
}
