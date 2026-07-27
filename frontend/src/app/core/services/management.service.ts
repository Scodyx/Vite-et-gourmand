import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export interface Allergen{id:number;name:string}
export interface AdminAllergen extends Allergen{dishCount:number}
export interface DishAllergens{dishId:number;dishName:string;allergens:Allergen[];allergenCount:number}
export interface Dish{id:number;name:string;description:string|null;type:'ENTRY'|'MAIN_COURSE'|'DESSERT';active:boolean;allergens:Allergen[];menuCount:number}
export interface Employee{id:number;firstName:string;lastName:string;email:string;phone:string;role:'EMPLOYEE';enabled:boolean;createdAt:string}
export interface MenuStat{menuId:number;menuTitle:string;date:string;orderCount:number;grossRevenue:number;discountTotal:number;deliveryRevenue:number;totalRevenue:number}
export interface RevenueSummary{orderCount:number;grossRevenue:number;discountTotal:number;deliveryRevenue:number;totalRevenue:number}
export interface OpeningHours{id:number;dayOfWeek:string;openingTime:string|null;closingTime:string|null;closed:boolean;displayOrder:number}
export interface AdminMenu{id:number;title:string;slug:string;description:string;conditions:string;minimumPersons:number;basePrice:number;availableStock:number;active:boolean;theme:string;diet:string;imageUrl:string|null;updatedAt:string}
export interface MenuDishItem{id:number;name:string;type:Dish['type'];active:boolean}
export interface MenuDishes{menuId:number;title:string;active:boolean;dishes:MenuDishItem[];dishCount:number}
@Injectable({providedIn:'root'})
export class ManagementService{
 constructor(private http:HttpClient){}
 allergens(){return this.http.get<Allergen[]>(`${environment.apiUrl}/employee/allergens`);}
 adminAllergens(){return this.http.get<AdminAllergen[]>(`${environment.apiUrl}/admin/allergens`);}
 adminAllergen(id:number){return this.http.get<AdminAllergen>(`${environment.apiUrl}/admin/allergens/${id}`);}
 createAdminAllergen(name:string){return this.http.post<Allergen>(`${environment.apiUrl}/admin/allergens`,{name});}
 updateAdminAllergen(id:number,name:string){return this.http.put<Allergen>(`${environment.apiUrl}/admin/allergens/${id}`,{name});}
 dishes(){return this.http.get<Dish[]>(`${environment.apiUrl}/employee/dishes`);}
 adminDishes(){return this.http.get<Dish[]>(`${environment.apiUrl}/admin/dishes`);}
 adminDish(id:number){return this.http.get<Dish>(`${environment.apiUrl}/admin/dishes/${id}`);}
 createAdminDish(value:object){return this.http.post<Dish>(`${environment.apiUrl}/admin/dishes`,value);}
 updateAdminDish(id:number,value:object){return this.http.put<Dish>(`${environment.apiUrl}/admin/dishes/${id}`,value);}
 enableDish(id:number,value:boolean){return this.http.patch<Dish>(`${environment.apiUrl}/admin/dishes/${id}/enabled`,null,{params:{value}});}
 dishAllergens(id:number){return this.http.get<DishAllergens>(`${environment.apiUrl}/admin/dishes/${id}/allergens`);}
 setDishAllergens(id:number,allergenIds:number[]){return this.http.put<DishAllergens>(`${environment.apiUrl}/admin/dishes/${id}/allergens`,{allergenIds});}
 addDishAllergen(id:number,allergenId:number){return this.http.post<DishAllergens>(`${environment.apiUrl}/admin/dishes/${id}/allergens/${allergenId}`,{});}
 removeDishAllergen(id:number,allergenId:number){return this.http.delete<DishAllergens>(`${environment.apiUrl}/admin/dishes/${id}/allergens/${allergenId}`);}
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
 menuDishes(id:number){return this.http.get<MenuDishes>(`${environment.apiUrl}/admin/menus/${id}/dishes`);}
 addMenuDish(menuId:number,dishId:number){return this.http.post<MenuDishes>(`${environment.apiUrl}/admin/menus/${menuId}/dishes/${dishId}`,{});}
 removeMenuDish(menuId:number,dishId:number){return this.http.delete<MenuDishes>(`${environment.apiUrl}/admin/menus/${menuId}/dishes/${dishId}`);}
 setMenuDishes(menuId:number,dishIds:number[]){return this.http.put<MenuDishes>(`${environment.apiUrl}/admin/menus/${menuId}/dishes`,{dishIds});}
}
