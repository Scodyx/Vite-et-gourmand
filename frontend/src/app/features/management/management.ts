import { Component,inject,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BusinessService,Review,UserProfile } from '../../core/services/business.service';
import { Allergen,Dish,Employee,ManagementService,MenuStat } from '../../core/services/management.service';

@Component({standalone:true,imports:[FormsModule],template:`<section class="container section"><h1>Mon profil</h1>
@if(profile();as p){<form class="form-card wide" (ngSubmit)="save()"><div class="two"><label>Prénom<input [(ngModel)]="p.firstName" name="firstName" required></label>
<label>Nom<input [(ngModel)]="p.lastName" name="lastName" required></label><label>Téléphone<input [(ngModel)]="p.phone" name="phone"></label>
<label>Adresse<input [(ngModel)]="p.addressLine" name="addressLine" required></label><label>Code postal<input [(ngModel)]="p.postalCode" name="postalCode" required></label>
<label>Ville<input [(ngModel)]="p.city" name="city" required></label><label>Pays<input [(ngModel)]="p.country" name="country" required></label></div>
<button class="button" [disabled]="loading()">Enregistrer</button>@if(message()){<p class="alert" aria-live="polite">{{message()}}</p>}</form>}</section>`})
export class ProfileComponent{
 private api=inject(BusinessService);profile=signal<UserProfile|null>(null);loading=signal(false);message=signal('');
 constructor(){this.api.profile().subscribe(p=>this.profile.set(p));}save(){const p=this.profile();if(!p)return;this.loading.set(true);this.api.updateProfile(p).subscribe({next:v=>{this.profile.set(v);this.message.set('Profil enregistré.');this.loading.set(false);},error:()=>{this.message.set('Échec de l’enregistrement.');this.loading.set(false);}});}
}

@Component({standalone:true,imports:[FormsModule],template:`<section class="container section"><h1>Plats et allergènes</h1>
<div class="card"><h2>Allergènes</h2>@for(a of allergens();track a.id){<span class="tag">{{a.name}} </span>}@empty{<p>Aucun allergène.</p>}</div>
<form class="form-card wide" (ngSubmit)="addDish()"><h2>Nouveau plat</h2><label>Nom<input [(ngModel)]="dish.name" name="name" required></label>
<label>Description<textarea [(ngModel)]="dish.description" name="description"></textarea></label><label>Type<select [(ngModel)]="dish.type" name="type">
<option value="ENTRY">Entrée</option><option value="MAIN_COURSE">Plat</option><option value="DESSERT">Dessert</option></select></label>
<button class="button">Créer le plat</button></form><div class="cards">@for(d of dishes();track d.id){<article class="card"><h2>{{d.name}}</h2><p>{{d.description}}</p><span class="tag">{{d.type}}</span></article>}</div></section>`})
export class CatalogManagementComponent{
 private api=inject(ManagementService);allergens=signal<Allergen[]>([]);dishes=signal<Dish[]>([]);dish={name:'',description:'',type:'ENTRY',active:true,allergenIds:[] as number[]};
 constructor(){this.load();}load(){this.api.allergens().subscribe(v=>this.allergens.set(v));this.api.dishes().subscribe(v=>this.dishes.set(v));}
 addDish(){this.api.createDish(this.dish).subscribe(()=>{this.dish={name:'',description:'',type:'ENTRY',active:true,allergenIds:[]};this.load();});}
}

@Component({standalone:true,template:`<section class="container section"><div class="section-heading"><h1>Modération des avis</h1>
<button class="button secondary small" type="button" (click)="load()" [disabled]="loading()">Actualiser</button></div>
@if(loading()){<p role="status">Chargement des avis…</p>}@else if(error()){<p class="alert" role="alert">{{error()}}</p>}
@else{<div class="cards">@for(r of reviews();track r.id){<article class="card"><h2>{{r.menuTitle}} · {{r.rating}}/5</h2>
<p>Commande n° {{r.orderId}} · {{r.customerFirstName}} · {{r.createdAt}}</p><p>{{r.comment}}</p><p class="tag">{{r.status}}</p>
<button class="button small" type="button" [disabled]="processing()===r.id" (click)="moderate(r,'approve')">Approuver</button>
<button class="button secondary small" type="button" [disabled]="processing()===r.id" (click)="moderate(r,'reject')">Refuser</button></article>}
@empty{<p>Aucun avis en attente.</p>}</div>}
@if(message()){<p class="alert" aria-live="polite">{{message()}}</p>}</section>`,
styles:[`.section-heading{display:flex;gap:1rem;align-items:center;justify-content:space-between;flex-wrap:wrap}`]})
export class ReviewModerationComponent{
 private api=inject(BusinessService);reviews=signal<Review[]>([]);loading=signal(true);processing=signal<number|null>(null);error=signal('');message=signal('');
 constructor(){this.load();}load(){this.loading.set(true);this.error.set('');this.api.pendingReviews().subscribe({
  next:v=>{this.reviews.set(v);this.loading.set(false);},error:()=>{this.error.set('Impossible de charger les avis.');this.loading.set(false);}});}
 moderate(r:Review,a:'approve'|'reject'){if(this.processing())return;this.processing.set(r.id);this.error.set('');
  this.api.moderateReview(r.id,a).subscribe({next:()=>{this.processing.set(null);this.message.set(a==='approve'?'Avis approuvé.':'Avis refusé.');this.load();},
   error:e=>{this.processing.set(null);this.error.set(e.error?.message??'La modération a échoué.');}});}
}

@Component({standalone:true,imports:[FormsModule],template:`<section class="container section"><h1>Employés</h1>
<form class="form-card wide" (ngSubmit)="create()"><div class="two"><label>Prénom<input [(ngModel)]="form.firstName" name="firstName" required></label>
<label>Nom<input [(ngModel)]="form.lastName" name="lastName" required></label><label>E-mail<input type="email" [(ngModel)]="form.email" name="email" required></label>
<label>Mot de passe temporaire<input type="password" [(ngModel)]="form.temporaryPassword" name="password" required minlength="12"></label></div><button class="button">Créer</button></form>
<div class="cards">@for(e of employees();track e.id){<article class="card"><h2>{{e.firstName}} {{e.lastName}}</h2><p>{{e.email}}</p>
<button class="button secondary small" (click)="toggle(e)">{{e.enabled?'Désactiver':'Activer'}}</button></article>}</div></section>`})
export class EmployeeManagementComponent{
 private api=inject(ManagementService);employees=signal<Employee[]>([]);form={firstName:'',lastName:'',email:'',temporaryPassword:'',phone:''};
 constructor(){this.load();}load(){this.api.employees().subscribe(v=>this.employees.set(v));}create(){this.api.createEmployee(this.form).subscribe(()=>{this.form={firstName:'',lastName:'',email:'',temporaryPassword:'',phone:''};this.load();});}
 toggle(e:Employee){if(confirm(`${e.enabled?'Désactiver':'Activer'} ce compte ?`))this.api.enableEmployee(e.id,!e.enabled).subscribe(()=>this.load());}
}

@Component({standalone:true,template:`<section class="container section"><h1>Statistiques</h1><button class="button" (click)="rebuild()">Reconstruire depuis PostgreSQL</button>
<div class="cards">@for(s of stats();track s.menuId+'-'+s.date){<article class="card"><h2>{{s.menuTitle}}</h2><p>{{s.date}}</p><p>{{s.orderCount}} commande(s)</p><p class="price">{{s.totalRevenue}} €</p></article>}
@empty{<p>Aucune statistique. Lancez une reconstruction.</p>}</div></section>`})
export class StatisticsComponent{
 private api=inject(ManagementService);stats=signal<MenuStat[]>([]);constructor(){this.load();}load(){this.api.statistics().subscribe(v=>this.stats.set(v));}
 rebuild(){this.api.rebuildStatistics().subscribe(v=>this.stats.set(v));}
}
