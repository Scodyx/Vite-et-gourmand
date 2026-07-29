import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { EmployeeOrderDetail,EmployeeOrderPage,EmployeeOrderQuery,Order,OrderDetail,OrderPage,OrderStatus,OrderUpdate } from '../models/order';
import { HttpParams } from '@angular/common/http';
@Injectable({providedIn:'root'})
export class OrderService {
 constructor(private http:HttpClient){}
 create(value:object){return this.http.post<Order>(`${environment.apiUrl}/orders`,value);}
 mine(){return this.http.get<OrderPage>(`${environment.apiUrl}/orders?size=50`);}
 detail(id:number){return this.http.get<OrderDetail>(`${environment.apiUrl}/users/me/orders/${id}`);}
 update(id:number,value:OrderUpdate){return this.http.put<Order>(`${environment.apiUrl}/users/me/orders/${id}`,value);}
 cancel(id:number,reason:string){return this.http.patch<Order>(`${environment.apiUrl}/users/me/orders/${id}/cancel`,{reason,contactMode:'CLIENT_EMAIL'});}
 employeeOrders(query:Partial<EmployeeOrderQuery>={}){
  let params=new HttpParams().set('page',query.page??0).set('size',query.size??20)
   .set('sort',query.sort??'serviceDate').set('direction',query.direction??'desc');
  for(const [key,value] of Object.entries(query)){
   if(!['page','size','sort','direction'].includes(key)&&value!==undefined&&value!==''&&value!==false)params=params.set(key,String(value));
  }
  return this.http.get<EmployeeOrderPage>(`${environment.apiUrl}/employee/orders`,{params});
 }
 all(query:Partial<EmployeeOrderQuery>={}){return this.employeeOrders(query);}
 employeeDetail(id:number){return this.http.get<EmployeeOrderDetail>(`${environment.apiUrl}/employee/orders/${id}`);}
 transition(id:number,status:OrderStatus,comment:string|null=null){
  return this.http.patch<Order>(`${environment.apiUrl}/employee/orders/${id}/status`,{status,comment});
 }
}
