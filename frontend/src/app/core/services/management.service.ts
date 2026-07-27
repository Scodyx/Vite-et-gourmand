import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export interface Allergen{id:number;name:string}
export interface Dish{id:number;name:string;description:string|null;type:'ENTRY'|'MAIN_COURSE'|'DESSERT';active:boolean;allergens:Allergen[];menuCount:number}
export interface Employee{id:number;firstName:string;lastName:string;email:string;phone:string;role:'EMPLOYEE';enabled:boolean;createdAt:string}
export interface MenuStat{menuId:number;menuTitle:string;date:string;orderCount:number;grossRevenue:number;discountTotal:number;deliveryRevenue:number;totalRevenue:number}
export interface RevenueSummary{orderCount:number;grossRevenue:number;discountTotal:number;deliveryRevenue:number;totalRevenue:number}
export interface OpeningHours{id:number;dayOfWeek:string;openingTime:string|null;closingTime:string|null;closed:boolean;displayOrder:number}
export interface AdminMenu{id:number;title:string;slug:string;description:string;conditions:string;minimumPersons:number;basePrice:number;availableStock:number;active:boolean;theme:string;diet:string;imageUrl:string|null;updatedAt:string}
@Injectable({providedIn:'root'})
export class ManagementService{
 constructor(private http:HttpClient){}
 allergens(){return this.http.get<Allergen[]>(`${environment.apiUrl}/employee/allergens`);}
 createAllergen(name:string){return this.http.post<Allergen>(`${environment.apiUrl}/employee/allergens`,{name});}
 dishes(){return this.http.get<Dish[]>(`${environment.apiUrl}/employee/dishes`);}
 createDish(value:object){return this.http.post<Dish>(`${environment.apiUrl}/employee/dishes`,value);}
 adminDishes(){return this.http.get<Dish[]>(`${environment.apiUrl}/admin/dishes`);}
 adminDish(id:number){return this.http.get<Dish>(`${environment.apiUrl}/admin/dishes/${id}`);}
 createAdminDish(value:object){return this.http.post<Dish>(`${environment.apiUrl}/admin/dishes`,value);}
 updateAdminDish(id:number,value:object){return this.http.put<Dish>(`${environment.apiUrl}/admin/dishes/${id}`,value);}
 enableDish(id:number,value:boolean){return this.http.patch<Dish>(`${environment.apiUrl}/admin/dishes/${id}/enabled`,null,{params:{value}});}
 employees(){return this.http.get<Employee[]>(`${environment.apiUrl}/admin/employees`);}
 createEmployee(value:object){return this.http.post<Employee>(`${environment.apiUrl}/admin/employees`,value);}
 enableEmployee(id:number,value:boolean){return this.http.patch<Employee>(`${environment.apiUrl}/admin/employees/${id}/enabled`,null,{params:{value}});}
 statistics(){return this.http.get<MenuStat[]>(`${environment.apiUrl}/admin/statistics/menus`);}
 revenue(){return this.http.get<RevenueSummary>(`${environment.apiUrl}/admin/statistics/revenue`);}
 rebuildStatistics(){return this.http.post<MenuStat[]>(`${environment.apiUrl}/admin/statistics/rebuild`,{});}
 openingHours(){return this.http.get<OpeningHours[]>(`${environment.apiUrl}/admin/opening-hours`);}
 updateOpeningHours(value:OpeningHours){return this.http.put<OpeningHours>(`${environment.apiUrl}/admin/opening-hours/${value.id}`,value);}
 menus(){return this.http.get<AdminMenu[]>(`${environment.apiUrl}/admin/menus`);}
 menu(id:number){return this.http.get<AdminMenu>(`${environment.apiUrl}/admin/menus/${id}`);}
 createMenu(value:object){return this.http.post<AdminMenu>(`${environment.apiUrl}/admin/menus`,value);}
 updateMenu(id:number,value:object){return this.http.put<AdminMenu>(`${environment.apiUrl}/admin/menus/${id}`,value);}
 enableMenu(id:number,value:boolean){return this.http.patch<AdminMenu>(`${environment.apiUrl}/admin/menus/${id}/enabled`,null,{params:{value}});}
}
