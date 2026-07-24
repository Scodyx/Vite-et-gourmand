import { Page } from './menu';
export type OrderStatus='PENDING'|'ACCEPTED'|'IN_PREPARATION'|'OUT_FOR_DELIVERY'|'DELIVERED'|'WAITING_FOR_EQUIPMENT_RETURN'|'COMPLETED'|'CANCELLED';
export interface Order {
 id:number;orderNumber:string;menuId:number;menuTitle:string;personCount:number;prestationDate:string;
 desiredDeliveryTime:string;deliveryAddress:string;deliveryPostalCode:string;deliveryCity:string;
 menuAmount:number;discountAmount:number;deliveryAmount:number;totalAmount:number;status:OrderStatus;
 equipmentLoaned:boolean;createdAt:string;
}
export type OrderPage=Page<Order>;
