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
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.scss'
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
