import { OrderStatus } from './order';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  IN_PREPARATION: 'En préparation',
  OUT_FOR_DELIVERY: 'En cours de livraison',
  DELIVERED: 'Livrée',
  WAITING_FOR_EQUIPMENT_RETURN: 'En attente du retour de matériel',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée'
};

export function orderStatusLabel(status: OrderStatus | null): string {
  return status ? ORDER_STATUS_LABELS[status] : '—';
}

export function allowedOrderTransitions(status: OrderStatus, equipmentLoaned: boolean): OrderStatus[] {
  const transitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
    PENDING: ['ACCEPTED', 'CANCELLED'],
    ACCEPTED: ['IN_PREPARATION', 'CANCELLED'],
    IN_PREPARATION: ['OUT_FOR_DELIVERY'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
    DELIVERED: equipmentLoaned ? ['WAITING_FOR_EQUIPMENT_RETURN'] : ['COMPLETED'],
    WAITING_FOR_EQUIPMENT_RETURN: ['COMPLETED']
  };
  return transitions[status] ?? [];
}
