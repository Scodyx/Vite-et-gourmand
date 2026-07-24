import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Order,OrderPage,OrderStatus } from '../models/order';
@Injectable({providedIn:'root'})
export class OrderService {
 constructor(private http:HttpClient){}
 create(value:object){return this.http.post<Order>(`${environment.apiUrl}/orders`,value);}
 mine(){return this.http.get<OrderPage>(`${environment.apiUrl}/orders?size=50`);}
 cancel(id:number,reason:string){return this.http.post<Order>(`${environment.apiUrl}/orders/${id}/cancel`,{reason,contactMode:'CLIENT_EMAIL'});}
 all(){return this.http.get<OrderPage>(`${environment.apiUrl}/employee/orders?size=100`);}
 transition(id:number,status:OrderStatus){return this.http.patch<Order>(`${environment.apiUrl}/employee/orders/${id}/status`,{status});}
}
