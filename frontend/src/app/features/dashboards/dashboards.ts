import { Component,inject,signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute,Router } from '@angular/router';
import { FormBuilder,ReactiveFormsModule,Validators } from '@angular/forms';
import { MenuService } from '../../core/services/menu.service';
import { OrderService } from '../../core/services/order.service';
import { Order,OrderStatus } from '../../core/models/order';

const statusLabels:Record<OrderStatus,string>={PENDING:'En attente',ACCEPTED:'Acceptée',IN_PREPARATION:'En préparation',
 OUT_FOR_DELIVERY:'En livraison',DELIVERED:'Livrée',WAITING_FOR_EQUIPMENT_RETURN:'Retour matériel',
 COMPLETED:'Terminée',CANCELLED:'Annulée'};

@Component({standalone:true,imports:[CommonModule],template:`
<section class="container section"><p class="eyebrow">Mon compte</p><h1>Mes commandes</h1>
@if(message()){<p class="alert">{{message()}}</p>}
<div class="cards">@for(o of orders();track o.id){<article class="card"><h2>{{o.orderNumber}}</h2>
<p><strong>{{o.menuTitle}}</strong> — {{o.personCount}} personnes</p><p>{{o.prestationDate|date:'dd/MM/yyyy'}} à {{o.desiredDeliveryTime}}</p>
<p class="tag">{{label(o.status)}}</p><p class="price">{{o.totalAmount|currency:'EUR'}}</p>
@if(o.status==='PENDING'){<button type="button" class="button secondary small" (click)="openCancellation(o)">Annuler</button>
@if(cancelOrderId()===o.id){<form (submit)="confirmCancellation(o,$event)" aria-label="Annulation de la commande">
<label [for]="'cancellation-reason-'+o.id">Motif de l’annulation</label>
<textarea [id]="'cancellation-reason-'+o.id" rows="3" minlength="3" required
 [value]="cancellationReason()" (input)="cancellationReason.set($any($event.target).value)"></textarea>
<div><button class="button small" [disabled]="cancellationReason().trim().length<3">Confirmer</button>
<button type="button" class="button secondary small" (click)="closeCancellation()">Retour</button></div>
</form>}}</article>}
@empty{<p>Aucune commande pour le moment.</p>}</div></section>`})
export class UserDashboardComponent{
 private api=inject(OrderService);orders=signal<Order[]>([]);message=signal('');
 cancelOrderId=signal<number|null>(null);cancellationReason=signal('');
 constructor(){this.load();} label(s:OrderStatus){return statusLabels[s];}
 load(){this.api.mine().subscribe({next:p=>this.orders.set(p.content),error:()=>this.message.set('Impossible de charger les commandes.')});}
 openCancellation(o:Order){this.cancelOrderId.set(o.id);this.cancellationReason.set('');}
 closeCancellation(){this.cancelOrderId.set(null);this.cancellationReason.set('');}
 confirmCancellation(o:Order,event:Event){event.preventDefault();const reason=this.cancellationReason().trim();if(reason.length<3)return;
  this.api.cancel(o.id,reason).subscribe({next:()=>{this.closeCancellation();this.load();},
   error:e=>this.message.set(e.error?.message??'Annulation impossible.')});}
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

@Component({standalone:true,imports:[CommonModule],template:`
<section class="container section"><p class="eyebrow">Espace équipe</p><h1>Gestion des commandes</h1>
<div class="cards">@for(o of orders();track o.id){<article class="card"><h2>{{o.orderNumber}}</h2><p>{{o.menuTitle}} — {{o.personCount}} personnes</p>
<p>{{o.prestationDate|date:'dd/MM/yyyy'}} — <span class="tag">{{label(o.status)}}</span></p>
<select [value]="o.status" (change)="change(o,$any($event.target).value)">@for(s of next(o.status);track s){<option [value]="s">{{label(s)}}</option>}</select>
</article>}@empty{<p>Aucune commande.</p>}</div></section>`})
export class EmployeeDashboardComponent{
 private api=inject(OrderService);orders=signal<Order[]>([]);
 constructor(){this.load();}load(){this.api.all().subscribe(p=>this.orders.set(p.content));}label(s:OrderStatus){return statusLabels[s];}
 next(s:OrderStatus):OrderStatus[]{const n:Partial<Record<OrderStatus,OrderStatus[]>>={PENDING:['PENDING','ACCEPTED','CANCELLED'],ACCEPTED:['ACCEPTED','IN_PREPARATION','CANCELLED'],
 IN_PREPARATION:['IN_PREPARATION','OUT_FOR_DELIVERY'],OUT_FOR_DELIVERY:['OUT_FOR_DELIVERY','DELIVERED'],DELIVERED:['DELIVERED','WAITING_FOR_EQUIPMENT_RETURN','COMPLETED'],
 WAITING_FOR_EQUIPMENT_RETURN:['WAITING_FOR_EQUIPMENT_RETURN','COMPLETED']};return n[s]??[s];}
 change(o:Order,s:OrderStatus){if(s!==o.status)this.api.transition(o.id,s).subscribe(()=>this.load());}
}

@Component({standalone:true,template:`<section class="container section"><p class="eyebrow">Administration</p>
<h1>Pilotage de l’activité</h1><p class="alert">Les modules employés et statistiques sont accessibles depuis leurs API sécurisées.</p></section>`})
export class AdminDashboardComponent{}
