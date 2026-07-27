import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { EmployeeOrderDetail,EmployeeOrderPage,Order,OrderDetail,OrderPage,OrderStatus,OrderUpdate } from '../models/order';
@Injectable({providedIn:'root'})
export class OrderService {
 constructor(private http:HttpClient){}
 create(value:object){return this.http.post<Order>(`${environment.apiUrl}/orders`,value);}
 mine(){return this.http.get<OrderPage>(`${environment.apiUrl}/orders?size=50`);}
 detail(id:number){return this.http.get<OrderDetail>(`${environment.apiUrl}/users/me/orders/${id}`);}
 update(id:number,value:OrderUpdate){return this.http.put<Order>(`${environment.apiUrl}/users/me/orders/${id}`,value);}
 cancel(id:number,reason:string){return this.http.patch<Order>(`${environment.apiUrl}/users/me/orders/${id}/cancel`,{reason,contactMode:'CLIENT_EMAIL'});}
 employeeOrders(){return this.http.get<EmployeeOrderPage>(`${environment.apiUrl}/employee/orders?size=100`);}
 all(){return this.employeeOrders();}
 employeeDetail(id:number){return this.http.get<EmployeeOrderDetail>(`${environment.apiUrl}/employee/orders/${id}`);}
 transition(id:number,status:OrderStatus,comment:string|null=null){
  return this.http.patch<Order>(`${environment.apiUrl}/employee/orders/${id}/status`,{status,comment});
 }
}
