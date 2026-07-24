import { Component,signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Menu } from '../../core/models/menu';
import { MenuService } from '../../core/services/menu.service';
import { BusinessService,Review } from '../../core/services/business.service';
@Component({standalone:true,selector:'app-home',imports:[RouterLink],template:`
<section class="hero"><div class="container hero-content"><p class="eyebrow">Traiteur à Bordeaux</p>
<h1>Des réceptions généreuses,<br><em>pensées pour vous</em></h1>
<p>Julie et José imaginent une cuisine élégante, responsable et chaleureuse pour vos plus beaux moments.</p>
<a class="button" routerLink="/menus">Découvrir nos menus</a></div></section>
<section class="section container"><p class="eyebrow">Notre savoir-faire</p><h2>L’exigence d’une maison, la proximité d’une équipe</h2>
<div class="three"><article class="card"><h3>Produits choisis</h3><p>Une cuisine de saison élaborée avec des partenaires de confiance.</p></article>
<article class="card"><h3>Service attentionné</h3><p>Un accompagnement précis, du premier échange jusqu’à votre réception.</p></article>
<article class="card"><h3>Moments uniques</h3><p>Des menus adaptables, préparés avec soin dans notre laboratoire bordelais.</p></article></div></section>
<section class="section container"><p class="eyebrow">À découvrir</p><h2>Nos menus du moment</h2><div class="three">
@for(menu of menus();track menu.id){<article class="card"><span class="tag">{{menu.theme}}</span><h3>{{menu.title}}</h3>
<p>{{menu.description}}</p><a class="button secondary" [routerLink]="['/menus',menu.slug]">Voir le menu</a></article>}
@empty{<p>Les menus sont momentanément indisponibles.</p>}</div></section>
<section class="section tinted"><div class="container"><p class="eyebrow">Ils nous font confiance</p><h2>Avis clients validés</h2>
@for(review of reviews();track review.id){<blockquote>« {{review.comment}} » <cite>— {{review.customerFirstName}}, {{review.menuTitle}} · {{review.rating}}/5</cite></blockquote>}
@empty{<p>Aucun avis publié pour le moment.</p>}</div></section>`})
export class HomeComponent{
 readonly menus=signal<Menu[]>([]);readonly reviews=signal<Review[]>([]);
 constructor(menus:MenuService,business:BusinessService){
  menus.list().subscribe({next:p=>this.menus.set(p.content.slice(0,3)),error:()=>this.menus.set([])});
  business.publicReviews().subscribe({next:r=>this.reviews.set(r.slice(0,3)),error:()=>this.reviews.set([])});
 }
}
