import { Component,signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Menu } from '../../core/models/menu';
import { MenuService } from '../../core/services/menu.service';
import { BusinessService,Review } from '../../core/services/business.service';
@Component({standalone:true,selector:'app-home',imports:[RouterLink],templateUrl: './home.html'})
export class HomeComponent{
 readonly menus=signal<Menu[]>([]);readonly reviews=signal<Review[]>([]);
 constructor(menus:MenuService,business:BusinessService){
  menus.list().subscribe({next:p=>this.menus.set(p.content.slice(0,3)),error:()=>this.menus.set([])});
  business.publicReviews().subscribe({next:r=>this.reviews.set(r.slice(0,3)),error:()=>this.reviews.set([])});
 }
}
