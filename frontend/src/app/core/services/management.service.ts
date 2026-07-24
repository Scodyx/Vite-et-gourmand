import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export interface Allergen{id:number;name:string}
export interface Dish{id:number;name:string;description:string;type:string;active:boolean;allergens:Allergen[]}
export interface Employee{id:number;firstName:string;lastName:string;email:string;phone:string;enabled:boolean}
export interface MenuStat{menuId:number;menuTitle:string;date:string;orderCount:number;grossRevenue:number;discountTotal:number;deliveryRevenue:number;totalRevenue:number}
@Injectable({providedIn:'root'})
export class ManagementService{
 constructor(private http:HttpClient){}
 allergens(){return this.http.get<Allergen[]>(`${environment.apiUrl}/employee/allergens`);}
 createAllergen(name:string){return this.http.post<Allergen>(`${environment.apiUrl}/employee/allergens`,{name});}
 dishes(){return this.http.get<Dish[]>(`${environment.apiUrl}/employee/dishes`);}
 createDish(value:object){return this.http.post<Dish>(`${environment.apiUrl}/employee/dishes`,value);}
 employees(){return this.http.get<Employee[]>(`${environment.apiUrl}/admin/employees`);}
 createEmployee(value:object){return this.http.post<Employee>(`${environment.apiUrl}/admin/employees`,value);}
 enableEmployee(id:number,value:boolean){return this.http.patch<Employee>(`${environment.apiUrl}/admin/employees/${id}/enabled`,null,{params:{value}});}
 statistics(){return this.http.get<MenuStat[]>(`${environment.apiUrl}/admin/statistics/menus`);}
 rebuildStatistics(){return this.http.post<MenuStat[]>(`${environment.apiUrl}/admin/statistics/rebuild`,{});}
}
