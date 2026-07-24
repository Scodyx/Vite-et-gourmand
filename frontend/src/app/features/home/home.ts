import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  standalone: true, selector: 'app-home', imports: [RouterLink],
  template: `<section class="hero"><div class="container hero-content"><p class="eyebrow">Traiteur à Bordeaux</p>
  <h1>Des réceptions généreuses,<br><em>pensées pour vous</em></h1>
  <p>Julie et José imaginent une cuisine élégante, responsable et chaleureuse pour vos plus beaux moments.</p>
  <a class="button" routerLink="/menus">Découvrir nos menus</a></div></section>
  <section class="section container"><p class="eyebrow">Notre savoir-faire</p><h2>L’exigence d’une maison, la proximité d’une équipe</h2>
  <div class="three"><article class="card"><h3>Produits choisis</h3><p>Une cuisine de saison élaborée avec des partenaires de confiance.</p></article>
  <article class="card"><h3>Service attentionné</h3><p>Un accompagnement précis, du premier échange jusqu’à votre réception.</p></article>
  <article class="card"><h3>Moments uniques</h3><p>Des menus adaptables, préparés avec soin dans notre laboratoire bordelais.</p></article></div></section>
  <section class="section tinted"><div class="container"><p class="eyebrow">Ils nous font confiance</p><h2>Avis clients validés</h2>
  <blockquote>« Une réception fluide et des assiettes aussi belles que savoureuses. » <cite>— Camille, avis de démonstration</cite></blockquote></div></section>`
})
export class HomeComponent {}
