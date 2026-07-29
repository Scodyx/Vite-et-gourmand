import { Component,computed,inject,signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute,Router,RouterLink } from '@angular/router';
import { FormBuilder,ReactiveFormsModule,Validators } from '@angular/forms';
import { MenuService } from '../../core/services/menu.service';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order';
import { orderStatusLabel } from '../../core/models/order-status';

@Component({standalone:true,imports:[CommonModule,RouterLink],templateUrl: './user-dashboard.html',styleUrl:'./user-dashboard.scss'})
export class UserDashboardComponent{
 private api=inject(OrderService);orders=signal<Order[]>([]);message=signal('');loading=signal(true);
 upcoming=computed(()=>this.orders().filter(o=>o.status!=='COMPLETED'&&o.status!=='CANCELLED'&&o.prestationDate>=new Date().toISOString().slice(0,10)));
 constructor(){this.load();} label=orderStatusLabel;
 load(){this.api.mine().subscribe({next:p=>{this.orders.set(p.content);this.loading.set(false);},
  error:()=>{this.message.set('Impossible de charger les commandes.');this.loading.set(false);}});}
}

@Component({standalone:true,imports:[ReactiveFormsModule,CommonModule],templateUrl: './order-create.html'})
export class OrderCreateComponent{
 private route=inject(ActivatedRoute);private menus=inject(MenuService);private orders=inject(OrderService);private router=inject(Router);private fb=inject(FormBuilder);
 menu=signal<any>(null);loading=signal(false);message=signal('');
 form=this.fb.nonNullable.group({personCount:[1,[Validators.required,Validators.min(1)]],prestationDate:['',Validators.required],
 desiredDeliveryTime:['',Validators.required],deliveryAddress:['',Validators.required],deliveryPostalCode:['',Validators.required],
 deliveryCity:['Bordeaux',Validators.required],deliveryCountry:['France',Validators.required],distanceKm:[0,[Validators.required,Validators.min(0)]],
 outsideBordeaux:[false],equipmentLoaned:[false]});
 constructor(){this.menus.detail(this.route.snapshot.paramMap.get('slug')!).subscribe(m=>{this.menu.set(m);this.form.controls.personCount.setValue(m.minimumPersons);});}
 submit(){if(this.form.invalid||!this.menu())return;this.loading.set(true);this.orders.create({menuId:this.menu().id,...this.form.getRawValue()}).subscribe({
  next:()=>this.router.navigateByUrl('/espace'),error:e=>{this.message.set(e.error?.message??'La commande a échoué.');this.loading.set(false);}});}
}

@Component({standalone:true,templateUrl: './admin-dashboard.html'})
export class AdminDashboardComponent{}
