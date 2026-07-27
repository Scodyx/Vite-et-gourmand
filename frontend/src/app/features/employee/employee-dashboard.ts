import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmployeeOrder, OrderStatus } from '../../core/models/order';
import { orderStatusLabel } from '../../core/models/order-status';
import { BusinessService } from '../../core/services/business.service';
import { OrderService } from '../../core/services/order.service';
import { forkJoin } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="container section">
      <div class="section-heading"><div><p class="eyebrow">Espace équipe</p><h1>Tableau de bord</h1></div>
        <button class="button secondary small" type="button" (click)="load()" [disabled]="loading()">Actualiser</button></div>
      @if (loading()) { <p role="status">Chargement du tableau de bord…</p> }
      @else if (error()) { <p class="alert" role="alert">{{error()}}</p> }
      @else {
        <div class="dashboard-summary">
          <article class="card"><strong>{{count('PENDING')}}</strong><span>en attente</span></article>
          <article class="card"><strong>{{count('ACCEPTED')}}</strong><span>acceptées</span></article>
          <article class="card"><strong>{{count('IN_PREPARATION')}}</strong><span>à préparer</span></article>
          <article class="card"><strong>{{count('OUT_FOR_DELIVERY')}}</strong><span>en livraison</span></article>
          <article class="card"><strong>{{count('WAITING_FOR_EQUIPMENT_RETURN')}}</strong><span>matériels à récupérer</span></article>
          <article class="card"><strong>{{pendingReviews()}}</strong><span>avis à modérer</span></article>
        </div>
        <nav class="actions" aria-label="Accès rapides"><a class="button" routerLink="/employe/commandes">Toutes les commandes</a>
          <a class="button secondary" routerLink="/employe/avis">Avis à modérer</a></nav>
        <h2>Commandes récentes</h2><div class="cards">
          @for (item of orders().slice(0, 5); track item.order.id) {
            <article class="card"><h3>{{item.order.orderNumber}}</h3>
              <p>{{item.customer.firstName}} {{item.customer.lastName}} · {{item.order.menuTitle}}</p>
              <p>{{item.order.prestationDate | date:'dd/MM/yyyy'}} · <span class="tag">{{label(item.order.status)}}</span></p>
              <a class="button secondary small" [routerLink]="['/employe/commandes', item.order.id]">Voir le détail</a>
            </article>
          } @empty { <p>Aucune commande disponible.</p> }
        </div>
      }
    </section>
  `,
  styles: [`.section-heading,.actions{display:flex;gap:1rem;align-items:center;justify-content:space-between;flex-wrap:wrap}.actions{justify-content:flex-start;margin:1.5rem 0}`]
})
export class EmployeeDashboardComponent {
  private readonly ordersApi = inject(OrderService);
  private readonly business = inject(BusinessService);
  readonly orders = signal<EmployeeOrder[]>([]);
  readonly pendingReviews = signal(0);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly label = orderStatusLabel;
  constructor() { this.load(); }
  load(): void {
    this.loading.set(true); this.error.set('');
    const statuses:OrderStatus[]=['PENDING','ACCEPTED','IN_PREPARATION','OUT_FOR_DELIVERY','WAITING_FOR_EQUIPMENT_RETURN'];
    forkJoin({
      recent:this.ordersApi.employeeOrders({page:0,size:5,sort:'createdAt',direction:'desc'}),
      reviews:this.business.pendingReviews(),
      counts:forkJoin(statuses.map(status=>this.ordersApi.employeeOrders({page:0,size:1,sort:'createdAt',direction:'desc',status})))
    }).subscribe({next:result=>{this.orders.set(result.recent.content);this.pendingReviews.set(result.reviews.length);
      this.statusCounts=new Map(statuses.map((status,index)=>[status,result.counts[index].totalElements]));this.loading.set(false);},
      error:()=>{this.error.set('Impossible de charger le tableau de bord.');this.loading.set(false);}});
  }
  private statusCounts=new Map<OrderStatus,number>();
  count(status: OrderStatus): number { return this.statusCounts.get(status)??0; }
}
