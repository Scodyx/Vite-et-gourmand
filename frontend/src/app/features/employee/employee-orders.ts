import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EmployeeOrder, OrderStatus } from '../../core/models/order';
import { ORDER_STATUS_LABELS, orderStatusLabel } from '../../core/models/order-status';
import { OrderService } from '../../core/services/order.service';

type DateScope = 'ALL' | 'TODAY' | 'UPCOMING';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="container section">
      <div class="section-heading">
        <div><p class="eyebrow">Espace équipe</p><h1>Commandes</h1></div>
        <button class="button secondary small" type="button" (click)="load()" [disabled]="loading()">Actualiser</button>
      </div>
      <form class="card filters" aria-label="Filtres des commandes" (submit)="$event.preventDefault()">
        <label>Statut<select [(ngModel)]="status" name="status"><option value="">Tous les statuts</option>
          @for (entry of statusEntries; track entry[0]) { <option [value]="entry[0]">{{entry[1]}}</option> }
        </select></label>
        <label>Date minimale<input type="date" [(ngModel)]="dateFrom" name="dateFrom"></label>
        <label>Date maximale<input type="date" [(ngModel)]="dateTo" name="dateTo"></label>
        <label>Recherche<input [(ngModel)]="search" name="search" placeholder="N° de commande, client ou e-mail"></label>
        <label>Période<select [(ngModel)]="dateScope" name="dateScope">
          <option value="ALL">Toutes</option><option value="TODAY">Aujourd’hui</option><option value="UPCOMING">À venir</option>
        </select></label>
        <button class="button secondary small" type="button" (click)="resetFilters()">Réinitialiser</button>
      </form>
      @if (loading()) { <p role="status">Chargement des commandes…</p> }
      @else if (error()) { <p class="alert" role="alert">{{error()}}</p> }
      @else {
        <p aria-live="polite">{{filtered().length}} commande(s) affichée(s).</p>
        <div class="table-scroll"><table>
          <thead><tr><th>Commande</th><th>Client</th><th>Menu</th><th>Prestation</th><th>Personnes</th><th>Ville</th><th>Total</th><th>Statut</th><th>Créée le</th><th></th></tr></thead>
          <tbody>
          @for (item of filtered(); track item.order.id) {
            <tr><td>{{item.order.orderNumber}}</td><td>{{customerName(item)}}<br><small>{{item.customer.email}}</small></td>
              <td>{{item.order.menuTitle}}</td><td>{{item.order.prestationDate | date:'dd/MM/yyyy'}}</td>
              <td>{{item.order.personCount}}</td><td>{{item.order.deliveryCity}}</td>
              <td>{{item.order.totalAmount | currency:'EUR'}}</td><td><span class="tag">{{label(item.order.status)}}</span></td>
              <td>{{item.order.createdAt | date:'dd/MM/yyyy HH:mm'}}</td>
              <td><a class="button secondary small" [routerLink]="['/employe/commandes', item.order.id]">Détail</a></td></tr>
          } @empty { <tr><td colspan="10">Aucune commande ne correspond aux filtres.</td></tr> }
          </tbody>
        </table></div>
      }
    </section>
  `,
  styles: [`
    .section-heading,.filters{display:flex;gap:1rem;align-items:end;justify-content:space-between;flex-wrap:wrap}
    .filters{margin:1rem 0}.filters label{min-width:10rem;flex:1}.table-scroll{overflow-x:auto}
    table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:.75rem;border-bottom:1px solid #ddd;vertical-align:top}
  `]
})
export class EmployeeOrdersComponent {
  private readonly api = inject(OrderService);
  readonly orders = signal<EmployeeOrder[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  status = ''; dateFrom = ''; dateTo = ''; search = ''; dateScope: DateScope = 'ALL';
  readonly statusEntries = Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][];
  readonly label = orderStatusLabel;
  readonly filtered = () => {
    const query = this.search.trim().toLocaleLowerCase('fr');
    const today = new Date().toISOString().slice(0, 10);
    return this.orders().filter(item => {
      const order = item.order;
      const searchable = `${order.orderNumber} ${item.customer.firstName} ${item.customer.lastName} ${item.customer.email}`.toLocaleLowerCase('fr');
      return (!this.status || order.status === this.status) && (!this.dateFrom || order.prestationDate >= this.dateFrom)
        && (!this.dateTo || order.prestationDate <= this.dateTo) && (!query || searchable.includes(query))
        && (this.dateScope === 'ALL' || (this.dateScope === 'TODAY' ? order.prestationDate === today : order.prestationDate > today));
    });
  };
  constructor() { this.load(); }
  load(): void {
    this.loading.set(true); this.error.set('');
    this.api.employeeOrders().subscribe({
      next: page => { this.orders.set(page.content); this.loading.set(false); },
      error: () => { this.error.set('Impossible de charger les commandes.'); this.loading.set(false); }
    });
  }
  resetFilters(): void { this.status = ''; this.dateFrom = ''; this.dateTo = ''; this.search = ''; this.dateScope = 'ALL'; }
  customerName(item: EmployeeOrder): string { return `${item.customer.firstName} ${item.customer.lastName}`.trim(); }
}
