import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export interface OpeningHours{id:number;dayOfWeek:string;openingTime:string|null;closingTime:string|null;closed:boolean;displayOrder:number}
export interface Review{id:number;orderId:number;menuTitle:string;customerFirstName:string;rating:number;comment:string;status:string;createdAt:string}
export interface UserProfile{id:number;email:string;firstName:string;lastName:string;phone:string;addressLine:string;postalCode:string;city:string;country:string;role:string}
@Injectable({providedIn:'root'})
export class BusinessService{
 constructor(private http:HttpClient){}
 publicHours(){return this.http.get<OpeningHours[]>(`${environment.apiUrl}/public/opening-hours`);}
 publicReviews(){return this.http.get<Review[]>(`${environment.apiUrl}/public/reviews`);}
 profile(){return this.http.get<UserProfile>(`${environment.apiUrl}/users/me`);}
 updateProfile(value:object){return this.http.put<UserProfile>(`${environment.apiUrl}/users/me`,value);}
 createReview(orderId:number,value:object){return this.http.post<Review>(`${environment.apiUrl}/users/me/orders/${orderId}/review`,value);}
 pendingReviews(){return this.http.get<Review[]>(`${environment.apiUrl}/employee/reviews/pending`);}
 moderateReview(id:number,action:'approve'|'reject'){return this.http.patch<Review>(`${environment.apiUrl}/employee/reviews/${id}/${action}`,{});}
}
