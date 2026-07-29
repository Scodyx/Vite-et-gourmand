import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { EmployeeOrder, EmployeeOrderQuery, EmployeeOrderSort, OrderStatus, SortDirection } from '../../core/models/order';
import { ORDER_STATUS_LABELS, orderStatusLabel } from '../../core/models/order-status';
import { OrderService } from '../../core/services/order.service';

type DateScope = 'ALL' | 'TODAY' | 'UPCOMING';

@Component({
 standalone:true,imports:[CommonModule,FormsModule,RouterLink],
 templateUrl: './employee-orders.html',
 styleUrl: './employee-orders.scss'
})
export class EmployeeOrdersComponent{
 private readonly api=inject(OrderService);private readonly route=inject(ActivatedRoute);private readonly router=inject(Router);
 private readonly searches=new Subject<string>();private readonly requests=new Subject<EmployeeOrderQuery>();
 readonly orders=signal<EmployeeOrder[]>([]);readonly loading=signal(true);readonly error=signal('');
 readonly page=signal(0);readonly totalElements=signal(0);readonly totalPages=signal(0);readonly first=signal(true);readonly last=signal(true);
 size=20;status='';dateFrom='';dateTo='';search='';dateScope:DateScope='ALL';sort:EmployeeOrderSort='serviceDate';direction:SortDirection='desc';
 readonly statusEntries=Object.entries(ORDER_STATUS_LABELS) as [OrderStatus,string][];readonly label=orderStatusLabel;
 constructor(){
  this.requests.pipe(switchMap(query=>{this.loading.set(true);this.error.set('');return this.api.employeeOrders(query);}))
   .subscribe({next:result=>{this.orders.set(result.content);this.page.set(result.page);this.size=result.size;this.totalElements.set(result.totalElements);
    this.totalPages.set(result.totalPages);this.first.set(result.first);this.last.set(result.last);this.loading.set(false);},
    error:()=>{this.error.set('Impossible de charger les commandes.');this.loading.set(false);}});
  this.searches.pipe(debounceTime(350),distinctUntilChanged()).subscribe(()=>this.filtersChanged());
  this.route.queryParamMap.subscribe(params=>{this.readParams(params);this.load();});
 }
 load():void{this.requests.next(this.query());}
 filtersChanged():void{this.navigate(0);}
 searchChanged(value:string):void{this.searches.next(value);}
 sizeChanged(value:number):void{this.size=Number(value);this.navigate(0);}
 goTo(page:number):void{if(page>=0&&page<this.totalPages())this.navigate(page);}
 resetFilters():void{this.status='';this.dateFrom='';this.dateTo='';this.search='';this.dateScope='ALL';this.sort='serviceDate';this.direction='desc';this.size=20;this.navigate(0);}
 customerName(item:EmployeeOrder):string{return `${item.customer.firstName} ${item.customer.lastName}`.trim();}
 private navigate(page:number):void{void this.router.navigate([],{relativeTo:this.route,queryParams:this.params(page)});}
 private query():EmployeeOrderQuery{return {page:this.page(),size:this.size,sort:this.sort,direction:this.direction,
  ...(this.status&&{status:this.status as OrderStatus}),...(this.dateFrom&&{dateFrom:this.dateFrom}),...(this.dateTo&&{dateTo:this.dateTo}),
  ...(this.search.trim()&&{search:this.search.trim()}),today:this.dateScope==='TODAY',upcoming:this.dateScope==='UPCOMING'};}
 private params(page:number):Record<string,string|number|boolean|null>{return {page,size:this.size,status:this.status||null,dateFrom:this.dateFrom||null,
  dateTo:this.dateTo||null,search:this.search.trim()||null,sort:this.sort,direction:this.direction,
  today:this.dateScope==='TODAY'||null,upcoming:this.dateScope==='UPCOMING'||null};}
 private readParams(params:import('@angular/router').ParamMap):void{this.page.set(Math.max(0,Number(params.get('page')??0)||0));
  this.size=[10,20,50,100].includes(Number(params.get('size')))?Number(params.get('size')):20;this.status=params.get('status')??'';
  this.dateFrom=params.get('dateFrom')??'';this.dateTo=params.get('dateTo')??'';this.search=params.get('search')??'';
  this.sort=(params.get('sort') as EmployeeOrderSort)??'serviceDate';this.direction=(params.get('direction') as SortDirection)??'desc';
  this.dateScope=params.get('today')==='true'?'TODAY':params.get('upcoming')==='true'?'UPCOMING':'ALL';}
}
