import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EmployeeOrderDetail, OrderStatus } from '../../core/models/order';
import { allowedOrderTransitions, orderStatusLabel } from '../../core/models/order-status';
import { OrderService } from '../../core/services/order.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="container section"><a routerLink="/employe/commandes">← Retour aux commandes</a>
      @if (loading()) { <p role="status">Chargement de la commande…</p> }
      @else if (error() && !detail()) { <p class="alert" role="alert">{{error()}}</p> }
      @else if (detail(); as detail) {
        <p class="eyebrow">Commande {{detail.summary.order.orderNumber}}</p>
        <div class="section-heading"><h1>Détail de la commande</h1><span class="tag">{{label(detail.summary.order.status)}}</span></div>
        <div class="detail-grid">
          <article class="card"><h2>Client</h2><p>{{detail.summary.customer.firstName}} {{detail.summary.customer.lastName}}</p>
            <p><a [href]="'mailto:'+detail.summary.customer.email">{{detail.summary.customer.email}}</a></p>
            @if (detail.summary.customer.phone) { <p><a [href]="'tel:'+detail.summary.customer.phone">{{detail.summary.customer.phone}}</a></p> }
          </article>
          <article class="card"><h2>Prestation</h2><p><strong>{{detail.summary.order.menuTitle}}</strong> · {{detail.summary.order.personCount}} personnes</p>
            <p>{{detail.summary.order.prestationDate | date:'dd/MM/yyyy'}} à {{detail.summary.order.desiredDeliveryTime}}</p>
            <p>{{detail.summary.order.deliveryAddress}}<br>{{detail.summary.order.deliveryPostalCode}} {{detail.summary.order.deliveryCity}}<br>{{detail.summary.order.deliveryCountry}}</p>
            <p>Distance : {{detail.summary.order.distanceKm}} km</p><p>Matériel prêté : {{detail.summary.order.equipmentLoaned ? 'Oui' : 'Non'}}</p>
          </article>
          <article class="card"><h2>Montants</h2><p>Menu : {{detail.summary.order.menuAmount | currency:'EUR'}}</p>
            <p>Remise : −{{detail.summary.order.discountAmount | currency:'EUR'}}</p><p>Livraison : {{detail.summary.order.deliveryAmount | currency:'EUR'}}</p>
            <p class="price">Total : {{detail.summary.order.totalAmount | currency:'EUR'}}</p></article>
        </div>
        @if (detail.summary.order.cancellationReason) { <p class="alert"><strong>Motif d’annulation :</strong> {{detail.summary.order.cancellationReason}}</p> }
        @if (transitions().length) {
          <section class="card transition-box" aria-labelledby="transition-title"><h2 id="transition-title">Changer le statut</h2>
            @if (!confirming()) { <div class="actions">@for (status of transitions(); track status) {
              <button class="button small" type="button" (click)="prepare(status)">{{label(status)}}</button>
            }</div> } @else {
              <p>Confirmer le passage à « {{label(confirming())}} » ?</p>
              <label>Commentaire facultatif<textarea [(ngModel)]="comment" name="comment"></textarea></label>
              <div class="actions"><button class="button small" type="button" (click)="confirmTransition()" [disabled]="submitting()">Confirmer</button>
                <button class="button secondary small" type="button" (click)="closeConfirmation()" [disabled]="submitting()">Annuler</button></div>
            }
          </section>
        }
        @if (message()) { <p class="alert success" aria-live="polite">{{message()}}</p> }
        @if (error()) { <p class="alert" role="alert">{{error()}}</p> }
        <section aria-labelledby="history-title"><h2 id="history-title">Historique</h2><ol class="timeline">
          @for (entry of detail.history; track entry.changedAt) {
            <li><strong>{{label(entry.previousStatus)}} → {{label(entry.newStatus)}}</strong>
              <time [attr.datetime]="entry.changedAt">{{entry.changedAt | date:'dd/MM/yyyy HH:mm'}}</time>
              @if (entry.actor) { <span> · {{entry.actor}}</span> } @if (entry.comment) { <p>{{entry.comment}}</p> }</li>
          } @empty { <li>Aucun historique disponible.</li> }
        </ol></section>
      }
    </section>
  `,
  styles: [`
    .section-heading,.actions{display:flex;align-items:center;gap:.75rem;justify-content:space-between;flex-wrap:wrap}
    .detail-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:1rem}
    .transition-box{margin:1.5rem 0}.transition-box label,.transition-box textarea{display:block;width:100%}
    .timeline{border-left:2px solid #ccc;padding-left:1.5rem}.timeline li{margin-bottom:1rem}
  `]
})
export class EmployeeOrderDetailComponent {
  private readonly api = inject(OrderService);
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  readonly detail = signal<EmployeeOrderDetail | null>(null);
  readonly loading = signal(true); readonly submitting = signal(false);
  readonly error = signal(''); readonly message = signal('');
  readonly confirming = signal<OrderStatus | null>(null);
  comment = ''; readonly label = orderStatusLabel;
  readonly transitions = computed(() => {
    const order = this.detail()?.summary.order;
    return order ? allowedOrderTransitions(order.status, order.equipmentLoaned) : [];
  });
  constructor() { this.load(); }
  load(): void {
    if (!Number.isInteger(this.id) || this.id <= 0) { this.error.set('Commande introuvable.'); this.loading.set(false); return; }
    this.loading.set(true);
    this.api.employeeDetail(this.id).subscribe({
      next: detail => { this.detail.set(detail); this.error.set(''); this.loading.set(false); },
      error: response => {
        this.error.set(response.status === 404 ? 'Commande introuvable.' : response.status === 403 ? 'Accès interdit.' : 'Impossible de charger la commande.');
        this.loading.set(false);
      }
    });
  }
  prepare(status: OrderStatus): void { this.confirming.set(status); this.comment = ''; this.error.set(''); this.message.set(''); }
  closeConfirmation(): void { this.confirming.set(null); this.comment = ''; }
  confirmTransition(): void {
    const status = this.confirming(); if (!status || this.submitting()) return;
    this.submitting.set(true); this.error.set('');
    this.api.transition(this.id, status, this.comment.trim() || null).subscribe({
      next: () => { this.submitting.set(false); this.confirming.set(null); this.comment = ''; this.message.set('Statut mis à jour.'); this.load(); },
      error: response => { this.submitting.set(false); this.error.set(response.error?.message ?? 'Le changement de statut a été refusé.'); }
    });
  }
}
