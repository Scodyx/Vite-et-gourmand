import { Page } from './menu';
export type OrderStatus='PENDING'|'ACCEPTED'|'IN_PREPARATION'|'OUT_FOR_DELIVERY'|'DELIVERED'|'WAITING_FOR_EQUIPMENT_RETURN'|'COMPLETED'|'CANCELLED';
export interface Order {
 id:number;orderNumber:string;menuId:number;menuTitle:string;personCount:number;prestationDate:string;
 desiredDeliveryTime:string;deliveryAddress:string;deliveryPostalCode:string;deliveryCity:string;
 deliveryCountry:string;distanceKm:number;
 menuAmount:number;discountAmount:number;deliveryAmount:number;totalAmount:number;status:OrderStatus;
 equipmentLoaned:boolean;cancellationReason:string|null;createdAt:string;
}
export interface OrderHistory {
 previousStatus:OrderStatus|null;newStatus:OrderStatus;changedAt:string;actor:string|null;comment:string|null;
}
export interface OrderDetail {order:Order;history:OrderHistory[];reviewSubmitted:boolean}
export interface OrderUpdate {
 personCount:number;prestationDate:string;desiredDeliveryTime:string;deliveryAddress:string;
 deliveryPostalCode:string;deliveryCity:string;deliveryCountry:string;distanceKm:number;
}
export type OrderPage=Page<Order>;
