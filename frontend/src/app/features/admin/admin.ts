import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BusinessService } from '../../core/services/business.service';
import { Employee, ManagementService, MenuStat, OpeningHours, RevenueSummary } from '../../core/services/management.service';
import { OrderService } from '../../core/services/order.service';
import { EmployeeOrder } from '../../core/models/order';
import { orderStatusLabel } from '../../core/models/order-status';

@Component({standalone:true,imports:[CommonModule,RouterLink],templateUrl: './admin-dashboard.html'})
export class AdminDashboardComponent{
 private management=inject(ManagementService);private orderApi=inject(OrderService);private business=inject(BusinessService);
 loading=signal(true);error=signal('');orders=signal<EmployeeOrder[]>([]);totalOrders=signal(0);pendingOrders=signal(0);completedOrders=signal(0);cancelledOrders=signal(0);employees=signal<Employee[]>([]);revenue=signal<RevenueSummary|null>(null);pendingReviews=signal(0);label=orderStatusLabel;
 activeEmployees=computed(()=>this.employees().filter(e=>e.enabled).length);disabledEmployees=computed(()=>this.employees().filter(e=>!e.enabled).length);
 constructor(){this.load();}
 load(){this.loading.set(true);this.error.set('');forkJoin({orders:this.orderApi.employeeOrders({size:5,sort:'createdAt'}),pending:this.orderApi.employeeOrders({size:1,status:'PENDING'}),completed:this.orderApi.employeeOrders({size:1,status:'COMPLETED'}),cancelled:this.orderApi.employeeOrders({size:1,status:'CANCELLED'}),employees:this.management.employees(),revenue:this.management.revenue(),reviews:this.business.pendingReviews()}).subscribe({
  next:r=>{this.orders.set(r.orders.content);this.totalOrders.set(r.orders.totalElements);this.pendingOrders.set(r.pending.totalElements);this.completedOrders.set(r.completed.totalElements);this.cancelledOrders.set(r.cancelled.totalElements);this.employees.set(r.employees);this.revenue.set(r.revenue);this.pendingReviews.set(r.reviews.length);this.loading.set(false);},error:()=>{this.error.set('Impossible de charger le tableau de bord.');this.loading.set(false);}});}
}

@Component({standalone:true,imports:[CommonModule,FormsModule],templateUrl: './admin-employees.html'})
export class AdminEmployeesComponent{
 private api=inject(ManagementService);employees=signal<Employee[]>([]);submitting=signal(false);processing=signal<number|null>(null);error=signal('');message=signal('');
 search='';enabledFilter='';confirmation='';form={firstName:'',lastName:'',email:'',temporaryPassword:'',phone:''};
 filtered=computed(()=>{const q=this.search.trim().toLowerCase();return this.employees().filter(e=>(!q||`${e.firstName} ${e.lastName} ${e.email}`.toLowerCase().includes(q))&&(!this.enabledFilter||String(e.enabled)===this.enabledFilter));});
 constructor(){this.load();}passwordError(){const p=this.form.temporaryPassword;if(!p)return '';if(p!==this.confirmation)return 'Les mots de passe sont différents.';return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/.test(p)?'':'Le mot de passe doit contenir 12 caractères, majuscule, minuscule, chiffre et symbole.';}
 load(){this.api.employees().subscribe({next:v=>this.employees.set(v),error:()=>this.error.set('Impossible de charger les employés.')});}
 create(){if(this.passwordError())return;this.submitting.set(true);this.api.createEmployee(this.form).subscribe({next:()=>{this.message.set('Employé créé.');this.reset();this.submitting.set(false);this.load();},error:e=>{this.resetPasswords();this.error.set(e.error?.message??'Création impossible.');this.submitting.set(false);}});}
 toggle(e:Employee){if(!confirm(`${e.enabled?'Désactiver':'Réactiver'} cet employé ?`))return;this.processing.set(e.id);this.api.enableEmployee(e.id,!e.enabled).subscribe({next:()=>{this.processing.set(null);this.message.set('État mis à jour.');this.load();},error:()=>{this.processing.set(null);this.error.set('Modification impossible.');}});}
 private reset(){this.form={firstName:'',lastName:'',email:'',temporaryPassword:'',phone:''};this.confirmation='';}private resetPasswords(){this.form.temporaryPassword='';this.confirmation='';}
}

@Component({standalone:true,imports:[FormsModule],templateUrl: './admin-opening-hours.html'})
export class AdminOpeningHoursComponent{
 private api=inject(ManagementService);hours=signal<OpeningHours[]>([]);loading=signal(true);saving=signal(false);error=signal('');message=signal('');
 constructor(){this.load();}day(v:string){return ({MONDAY:'Lundi',TUESDAY:'Mardi',WEDNESDAY:'Mercredi',THURSDAY:'Jeudi',FRIDAY:'Vendredi',SATURDAY:'Samedi',SUNDAY:'Dimanche'} as Record<string,string>)[v]??v;}
 load(){this.api.openingHours().subscribe({next:v=>{this.hours.set(v);this.loading.set(false);},error:()=>{this.error.set('Impossible de charger les horaires.');this.loading.set(false);}});}
 closedChanged(h:OpeningHours){if(h.closed){h.openingTime=null;h.closingTime=null;}}
 save(){if(this.hours().some(h=>!h.closed&&(!h.openingTime||!h.closingTime||h.openingTime>=h.closingTime))){this.error.set('L’ouverture doit précéder la fermeture.');return;}this.saving.set(true);forkJoin(this.hours().map(h=>this.api.updateOpeningHours(h))).subscribe({next:()=>{this.saving.set(false);this.message.set('Horaires enregistrés.');this.load();},error:e=>{this.saving.set(false);this.error.set(e.error?.message??'Enregistrement impossible.');}});}
}

@Component({standalone:true,imports:[CommonModule],templateUrl: './admin-statistics.html'})
export class AdminStatisticsComponent{
 private api=inject(ManagementService);stats=signal<MenuStat[]>([]);summary=signal<RevenueSummary|null>(null);rebuilding=signal(false);error=signal('');message=signal('');
 constructor(){this.load();}load(){forkJoin({stats:this.api.statistics(),summary:this.api.revenue()}).subscribe({next:r=>{this.stats.set(r.stats);this.summary.set(r.summary);},error:()=>this.error.set('Impossible de charger les statistiques.')});}
 rebuild(){if(!confirm('Reconstruire les statistiques depuis PostgreSQL ?'))return;this.rebuilding.set(true);this.api.rebuildStatistics().subscribe({next:()=>{this.rebuilding.set(false);this.message.set('Statistiques reconstruites.');this.load();},error:()=>{this.rebuilding.set(false);this.error.set('Reconstruction impossible.');}});}
}
