import { Component,inject,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BusinessService,Review,UserProfile } from '../../core/services/business.service';
import { Allergen,Dish,Employee,ManagementService,MenuStat } from '../../core/services/management.service';

@Component({standalone:true,imports:[FormsModule],templateUrl: './profile.html'})
export class ProfileComponent{
 private api=inject(BusinessService);profile=signal<UserProfile|null>(null);loading=signal(false);message=signal('');
 constructor(){this.api.profile().subscribe(p=>this.profile.set(p));}save(){const p=this.profile();if(!p)return;this.loading.set(true);this.api.updateProfile(p).subscribe({next:v=>{this.profile.set(v);this.message.set('Profil enregistré.');this.loading.set(false);},error:()=>{this.message.set('Échec de l’enregistrement.');this.loading.set(false);}});}
}

@Component({standalone:true,imports:[FormsModule],templateUrl: './catalog-management.html'})
export class CatalogManagementComponent{
 private api=inject(ManagementService);allergens=signal<Allergen[]>([]);dishes=signal<Dish[]>([]);
 constructor(){this.load();}load(){this.api.allergens().subscribe(v=>this.allergens.set(v));this.api.dishes().subscribe(v=>this.dishes.set(v));}
}

@Component({standalone:true,templateUrl: './review-moderation.html',
styleUrl: './review-moderation.scss'})
export class ReviewModerationComponent{
 private api=inject(BusinessService);reviews=signal<Review[]>([]);loading=signal(true);processing=signal<number|null>(null);error=signal('');message=signal('');
 constructor(){this.load();}load(){this.loading.set(true);this.error.set('');this.api.pendingReviews().subscribe({
  next:v=>{this.reviews.set(v);this.loading.set(false);},error:()=>{this.error.set('Impossible de charger les avis.');this.loading.set(false);}});}
 moderate(r:Review,a:'approve'|'reject'){if(this.processing())return;this.processing.set(r.id);this.error.set('');
  this.api.moderateReview(r.id,a).subscribe({next:()=>{this.processing.set(null);this.message.set(a==='approve'?'Avis approuvé.':'Avis refusé.');this.load();},
   error:e=>{this.processing.set(null);this.error.set(e.error?.message??'La modération a échoué.');}});}
}

@Component({standalone:true,imports:[FormsModule],templateUrl: './employee-management.html'})
export class EmployeeManagementComponent{
 private api=inject(ManagementService);employees=signal<Employee[]>([]);form={firstName:'',lastName:'',email:'',temporaryPassword:'',phone:''};
 constructor(){this.load();}load(){this.api.employees().subscribe(v=>this.employees.set(v));}create(){this.api.createEmployee(this.form).subscribe(()=>{this.form={firstName:'',lastName:'',email:'',temporaryPassword:'',phone:''};this.load();});}
 toggle(e:Employee){if(confirm(`${e.enabled?'Désactiver':'Activer'} ce compte ?`))this.api.enableEmployee(e.id,!e.enabled).subscribe(()=>this.load());}
}

@Component({standalone:true,templateUrl: './statistics.html'})
export class StatisticsComponent{
 private api=inject(ManagementService);stats=signal<MenuStat[]>([]);constructor(){this.load();}load(){this.api.statistics().subscribe(v=>this.stats.set(v));}
 rebuild(){this.api.rebuildStatistics().subscribe(v=>this.stats.set(v));}
}
