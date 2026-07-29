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
  templateUrl: './employee-order-detail.html',
  styleUrl: './employee-order-detail.scss'
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
