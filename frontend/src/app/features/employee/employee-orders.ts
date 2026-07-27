import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { EmployeeOrder, EmployeeOrderQuery, EmployeeOrderSort, OrderStatus, SortDirection } from '../../core/models/order';
import { ORDER_STATUS_LABELS, orderStatusLabel } from '../../core/models/order-status';
import { OrderService } from '../../core/services/order.service';

type DateScope = 'ALL' | 'TODAY' | 'UPCOMING';

@Component({
 standalone:true,imports:[CommonModule,FormsModule,RouterLink],
 template:`
 <section class="container section">
  <div class="section-heading"><div><p class="eyebrow">Espace équipe</p><h1>Commandes</h1></div>
   <button class="button secondary small" type="button" (click)="load()" [disabled]="loading()">Actualiser</button></div>
  <form class="card filters" aria-label="Filtres des commandes" (submit)="$event.preventDefault()">
   <label>Statut<select [(ngModel)]="status" name="status" (ngModelChange)="filtersChanged()"><option value="">Tous les statuts</option>
    @for(entry of statusEntries;track entry[0]){<option [value]="entry[0]">{{entry[1]}}</option>}</select></label>
   <label>Date minimale<input type="date" [(ngModel)]="dateFrom" name="dateFrom" (change)="filtersChanged()"></label>
   <label>Date maximale<input type="date" [(ngModel)]="dateTo" name="dateTo" (change)="filtersChanged()"></label>
   <label>Recherche<input [(ngModel)]="search" name="search" (ngModelChange)="searchChanged($event)" placeholder="N° de commande, client ou e-mail"></label>
   <label>Période<select [(ngModel)]="dateScope" name="dateScope" (ngModelChange)="filtersChanged()">
    <option value="ALL">Toutes</option><option value="TODAY">Aujourd’hui</option><option value="UPCOMING">À venir</option></select></label>
   <label>Tri<select [(ngModel)]="sort" name="sort" (ngModelChange)="filtersChanged()">
    <option value="serviceDate">Date de prestation</option><option value="createdAt">Date de création</option>
    <option value="totalAmount">Montant</option><option value="status">Statut</option><option value="orderNumber">Numéro</option></select></label>
   <label>Direction<select [(ngModel)]="direction" name="direction" (ngModelChange)="filtersChanged()">
    <option value="desc">Décroissant</option><option value="asc">Croissant</option></select></label>
   <button class="button secondary small" type="button" (click)="resetFilters()">Réinitialiser</button>
  </form>
  @if(loading()){<p role="status">Chargement des commandes…</p>}
  @else if(error()){<p class="alert" role="alert">{{error()}}</p>}
  @else{
   <p aria-live="polite">{{totalElements()}} commande(s) · page {{page()+1}} sur {{totalPages()||1}}</p>
   <div class="table-scroll"><table><thead><tr><th>Commande</th><th>Client</th><th>Menu</th><th>Prestation</th>
    <th>Personnes</th><th>Ville</th><th>Total</th><th>Statut</th><th>Créée le</th><th></th></tr></thead><tbody>
    @for(item of orders();track item.order.id){<tr><td>{{item.order.orderNumber}}</td>
     <td>{{customerName(item)}}<br><small>{{item.customer.email}}</small></td><td>{{item.order.menuTitle}}</td>
     <td>{{item.order.prestationDate|date:'dd/MM/yyyy'}}</td><td>{{item.order.personCount}}</td><td>{{item.order.deliveryCity}}</td>
     <td>{{item.order.totalAmount|currency:'EUR'}}</td><td><span class="tag">{{label(item.order.status)}}</span></td>
     <td>{{item.order.createdAt|date:'dd/MM/yyyy HH:mm'}}</td>
     <td><a class="button secondary small" [routerLink]="['/employe/commandes',item.order.id]">Détail</a></td></tr>}
    @empty{<tr><td colspan="10">Aucune commande ne correspond aux filtres.</td></tr>}</tbody></table></div>
   <nav class="pagination" aria-label="Pagination">
    <button type="button" class="button secondary small" (click)="goTo(0)" [disabled]="first()">Première</button>
    <button type="button" class="button secondary small" (click)="goTo(page()-1)" [disabled]="first()">Précédente</button>
    <button type="button" class="button secondary small" (click)="goTo(page()+1)" [disabled]="last()">Suivante</button>
    <button type="button" class="button secondary small" (click)="goTo(totalPages()-1)" [disabled]="last()">Dernière</button>
    <label>Résultats par page<select [(ngModel)]="size" (ngModelChange)="sizeChanged($event)">
     <option [ngValue]="10">10</option><option [ngValue]="20">20</option><option [ngValue]="50">50</option><option [ngValue]="100">100</option>
    </select></label>
   </nav>
  }
 </section>`,
 styles:[`.section-heading,.filters,.pagination{display:flex;gap:1rem;align-items:end;justify-content:space-between;flex-wrap:wrap}
 .filters{margin:1rem 0}.filters label{min-width:9rem;flex:1}.table-scroll{overflow-x:auto}
 table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:.75rem;border-bottom:1px solid #ddd;vertical-align:top}
 .pagination{justify-content:center;margin-top:1rem;align-items:center}`]
})
export class EmployeeOrdersComponent{
 private readonly api=inject(OrderService);private readonly route=inject(ActivatedRoute);private readonly router=inject(Router);
 private readonly searches=new Subject<string>();private readonly requests=new Subject<EmployeeOrderQuery>();
 readonly orders=signal<EmployeeOrder[]>([]);readonly loading=signal(true);readonly error=signal('');
 readonly page=signal(0);readonly totalElements=signal(0);readonly totalPages=signal(0);readonly first=signal(true);readonly last=signal(true);
 size=20;status='';dateFrom='';dateTo='';search='';dateScope:DateScope='ALL';sort:EmployeeOrderSort='serviceDate';direction:SortDirection='desc';
 readonly statusEntries=Object.entries(ORDER_STATUS_LABELS) as [OrderStatus,string][];readonly label=orderStatusLabel;
 constructor(){
  this.requests.pipe(switchMap(query=>{this.loading.set(true);this.error.set('');return this.api.employeeOrders(query);}))
   .subscribe({next:result=>{this.orders.set(result.content);this.page.set(result.page);this.size=result.size;this.totalElements.set(result.totalElements);
    this.totalPages.set(result.totalPages);this.first.set(result.first);this.last.set(result.last);this.loading.set(false);},
    error:()=>{this.error.set('Impossible de charger les commandes.');this.loading.set(false);}});
  this.searches.pipe(debounceTime(350),distinctUntilChanged()).subscribe(()=>this.filtersChanged());
  this.route.queryParamMap.subscribe(params=>{this.readParams(params);this.load();});
 }
 load():void{this.requests.next(this.query());}
 filtersChanged():void{this.navigate(0);}
 searchChanged(value:string):void{this.searches.next(value);}
 sizeChanged(value:number):void{this.size=Number(value);this.navigate(0);}
 goTo(page:number):void{if(page>=0&&page<this.totalPages())this.navigate(page);}
 resetFilters():void{this.status='';this.dateFrom='';this.dateTo='';this.search='';this.dateScope='ALL';this.sort='serviceDate';this.direction='desc';this.size=20;this.navigate(0);}
 customerName(item:EmployeeOrder):string{return `${item.customer.firstName} ${item.customer.lastName}`.trim();}
 private navigate(page:number):void{void this.router.navigate([],{relativeTo:this.route,queryParams:this.params(page)});}
 private query():EmployeeOrderQuery{return {page:this.page(),size:this.size,sort:this.sort,direction:this.direction,
  ...(this.status&&{status:this.status as OrderStatus}),...(this.dateFrom&&{dateFrom:this.dateFrom}),...(this.dateTo&&{dateTo:this.dateTo}),
  ...(this.search.trim()&&{search:this.search.trim()}),today:this.dateScope==='TODAY',upcoming:this.dateScope==='UPCOMING'};}
 private params(page:number):Record<string,string|number|boolean|null>{return {page,size:this.size,status:this.status||null,dateFrom:this.dateFrom||null,
  dateTo:this.dateTo||null,search:this.search.trim()||null,sort:this.sort,direction:this.direction,
  today:this.dateScope==='TODAY'||null,upcoming:this.dateScope==='UPCOMING'||null};}
 private readParams(params:import('@angular/router').ParamMap):void{this.page.set(Math.max(0,Number(params.get('page')??0)||0));
  this.size=[10,20,50,100].includes(Number(params.get('size')))?Number(params.get('size')):20;this.status=params.get('status')??'';
  this.dateFrom=params.get('dateFrom')??'';this.dateTo=params.get('dateTo')??'';this.search=params.get('search')??'';
  this.sort=(params.get('sort') as EmployeeOrderSort)??'serviceDate';this.direction=(params.get('direction') as SortDirection)??'desc';
  this.dateScope=params.get('today')==='true'?'TODAY':params.get('upcoming')==='true'?'UPCOMING':'ALL';}
}
