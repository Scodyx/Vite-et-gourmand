import {Component,computed,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute,Router,RouterLink} from '@angular/router';
import {AdminAllergen,ManagementService} from '../../core/services/management.service';

@Component({standalone:true,imports:[FormsModule,RouterLink],templateUrl: './admin-allergen-list.html'})
export class AdminAllergenListComponent{private api=inject(ManagementService);values=signal<AdminAllergen[]>([]);loading=signal(true);error=signal('');search='';
 filtered=computed(()=>{const q=this.search.trim().toLowerCase();return this.values().filter(a=>!q||a.name.toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name));});
 constructor(){this.load();}load(){this.loading.set(true);this.api.adminAllergens().subscribe({next:v=>{this.values.set(v);this.loading.set(false);},error:()=>{this.error.set('Chargement impossible.');this.loading.set(false);}});}}

@Component({standalone:true,imports:[RouterLink],templateUrl: './admin-allergen-detail.html'})
export class AdminAllergenDetailComponent{private api=inject(ManagementService);private route=inject(ActivatedRoute);value=signal<AdminAllergen|null>(null);error=signal('');
 constructor(){this.api.adminAllergen(Number(this.route.snapshot.paramMap.get('id'))).subscribe({next:v=>this.value.set(v),error:e=>this.error.set(e.status===404?'Allergène introuvable.':'Chargement impossible.')});}}

@Component({standalone:true,imports:[FormsModule,RouterLink],templateUrl: './admin-allergen-form.html'})
export class AdminAllergenFormComponent{private api=inject(ManagementService);private route=inject(ActivatedRoute);private router=inject(Router);id=Number(this.route.snapshot.paramMap.get('id'))||0;name='';saving=signal(false);error=signal('');
 constructor(){if(this.id)this.api.adminAllergen(this.id).subscribe({next:v=>this.name=v.name,error:()=>this.error.set('Allergène introuvable.')});}
 save(){if(this.saving())return;this.saving.set(true);this.error.set('');const request=this.id?this.api.updateAdminAllergen(this.id,this.name):this.api.createAdminAllergen(this.name);request.subscribe({next:v=>this.router.navigate(['/admin/allergenes',v.id]),error:e=>{this.error.set(e.error?.message??'Enregistrement impossible.');this.saving.set(false);}});}}
