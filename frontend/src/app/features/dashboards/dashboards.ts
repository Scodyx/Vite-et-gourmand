import { Component,computed,inject,signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute,Router,RouterLink } from '@angular/router';
import { FormBuilder,ReactiveFormsModule,Validators } from '@angular/forms';
import { MenuService } from '../../core/services/menu.service';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order';
import { orderStatusLabel } from '../../core/models/order-status';

@Component({standalone:true,imports:[CommonModule,RouterLink],template:`
<section class="container section"><p class="eyebrow">Mon compte</p><h1>Tableau de bord</h1>
@if(message()){<p class="alert">{{message()}}</p>}
@if(!loading()){
<div class="dashboard-summary"><article class="card"><strong>{{orders().length}}</strong><span>commandes au total</span></article>
<article class="card"><strong>{{upcoming().length}}</strong><span>prestations à venir</span></article>
<article class="card quick-links"><a routerLink="/profil">Mon profil</a><a href="#orders">Mes commandes</a></article></div>
<h2>Prochaines commandes</h2>
<div class="cards">@for(o of upcoming().slice(0,2);track o.id){<article class="card"><h3>{{o.orderNumber}}</h3>
<p>{{o.menuTitle}} — {{o.prestationDate|date:'dd/MM/yyyy'}}</p><p class="tag">{{label(o.status)}}</p>
<a class="button secondary small" [routerLink]="['/espace/commandes',o.id]">Voir le détail</a></article>}
@empty{<p>Aucune prestation à venir.</p>}</div>
<h2 id="orders">Dernières commandes</h2>
<div class="cards">@for(o of orders();track o.id){<article class="card"><h3>{{o.orderNumber}}</h3>
<p><strong>{{o.menuTitle}}</strong> — {{o.personCount}} personnes</p><p>{{o.prestationDate|date:'dd/MM/yyyy'}} à {{o.desiredDeliveryTime}}</p>
<p class="tag">{{label(o.status)}}</p><p class="price">{{o.totalAmount|currency:'EUR'}}</p>
<a class="button secondary small" [routerLink]="['/espace/commandes',o.id]">Voir le détail</a></article>}
@empty{<div class="empty"><p>Aucune commande pour le moment.</p><a class="button" routerLink="/menus">Découvrir les menus</a></div>}</div>}</section>`})
export class UserDashboardComponent{
 private api=inject(OrderService);orders=signal<Order[]>([]);message=signal('');loading=signal(true);
 upcoming=computed(()=>this.orders().filter(o=>o.status!=='COMPLETED'&&o.status!=='CANCELLED'&&o.prestationDate>=new Date().toISOString().slice(0,10)));
 constructor(){this.load();} label=orderStatusLabel;
 load(){this.api.mine().subscribe({next:p=>{this.orders.set(p.content);this.loading.set(false);},
  error:()=>{this.message.set('Impossible de charger les commandes.');this.loading.set(false);}});}
}

@Component({standalone:true,imports:[ReactiveFormsModule,CommonModule],template:`
<section class="form-page"><form class="form-card wide" [formGroup]="form" (ngSubmit)="submit()">
<p class="eyebrow">Nouvelle prestation</p><h1>Commander {{menu()?.title}}</h1>
@if(menu()){<p>Minimum {{menu()!.minimumPersons}} personnes — stock {{menu()!.availableStock}}</p>}
<div class="two"><label>Nombre de personnes<input type="number" formControlName="personCount"></label>
<label>Date<input type="date" formControlName="prestationDate"></label><label>Heure<input type="time" formControlName="desiredDeliveryTime"></label>
<label>Adresse<input formControlName="deliveryAddress"></label><label>Code postal<input formControlName="deliveryPostalCode"></label>
<label>Ville<input formControlName="deliveryCity"></label><label>Pays<input formControlName="deliveryCountry"></label>
<label>Distance (km)<input type="number" step=".1" formControlName="distanceKm"></label>
<label class="check"><input type="checkbox" formControlName="outsideBordeaux"> Hors Bordeaux</label>
<label class="check"><input type="checkbox" formControlName="equipmentLoaned"> Prêt de matériel</label></div>
<button class="button" [disabled]="form.invalid||loading()">Confirmer la commande</button>
@if(message()){<p class="alert">{{message()}}</p>}</form></section>`})
export class OrderCreateComponent{
 private route=inject(ActivatedRoute);private menus=inject(MenuService);private orders=inject(OrderService);private router=inject(Router);private fb=inject(FormBuilder);
 menu=signal<any>(null);loading=signal(false);message=signal('');
 form=this.fb.nonNullable.group({personCount:[1,[Validators.required,Validators.min(1)]],prestationDate:['',Validators.required],
 desiredDeliveryTime:['',Validators.required],deliveryAddress:['',Validators.required],deliveryPostalCode:['',Validators.required],
 deliveryCity:['Bordeaux',Validators.required],deliveryCountry:['France',Validators.required],distanceKm:[0,[Validators.required,Validators.min(0)]],
 outsideBordeaux:[false],equipmentLoaned:[false]});
 constructor(){this.menus.detail(this.route.snapshot.paramMap.get('slug')!).subscribe(m=>{this.menu.set(m);this.form.controls.personCount.setValue(m.minimumPersons);});}
 submit(){if(this.form.invalid||!this.menu())return;this.loading.set(true);this.orders.create({menuId:this.menu().id,...this.form.getRawValue()}).subscribe({
  next:()=>this.router.navigateByUrl('/espace'),error:e=>{this.message.set(e.error?.message??'La commande a échoué.');this.loading.set(false);}});}
}

@Component({standalone:true,template:`<section class="container section"><p class="eyebrow">Administration</p>
<h1>Pilotage de l’activité</h1><p class="alert">Les modules employés et statistiques sont accessibles depuis leurs API sécurisées.</p></section>`})
export class AdminDashboardComponent{}
