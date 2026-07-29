import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Dish, ManagementService } from '../../core/services/management.service';
import { forkJoin } from 'rxjs';

const labels:Record<string,string>={ENTRY:'Entrée',MAIN_COURSE:'Plat principal',DESSERT:'Dessert'};

@Component({standalone:true,imports:[FormsModule,RouterLink],templateUrl: './admin-dish-list.html'})
export class AdminDishListComponent{
 private api=inject(ManagementService);dishes=signal<Dish[]>([]);loading=signal(true);error=signal('');search='';activeFilter='';typeFilter='';label=(v:string)=>labels[v]??v;
 filtered=computed(()=>{const q=this.search.trim().toLowerCase();return this.dishes().filter(d=>(!q||d.name.toLowerCase().includes(q))&&(!this.activeFilter||String(d.active)===this.activeFilter)&&(!this.typeFilter||d.type===this.typeFilter)).sort((a,b)=>a.name.localeCompare(b.name));});
 constructor(){this.load();}load(){this.loading.set(true);this.api.adminDishes().subscribe({next:v=>{this.dishes.set(v);this.loading.set(false);},error:()=>{this.error.set('Impossible de charger les plats.');this.loading.set(false);}});}
}

@Component({standalone:true,imports:[FormsModule,RouterLink],templateUrl: './admin-dish-detail.html'})
export class AdminDishDetailComponent{
 private api=inject(ManagementService);private route=inject(ActivatedRoute);dish=signal<Dish|null>(null);error=signal('');processing=signal(false);label=(v:string)=>labels[v]??v;
 all=signal<{id:number;name:string}[]>([]);associationsLoading=signal(true);saving=signal(false);message=signal('');selected=new Set<number>();private saved=new Set<number>();search='';
 filtered(){const q=this.search.trim().toLowerCase();return this.all().filter(a=>!q||a.name.toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name));}
 constructor(){this.load();}load(){this.api.adminDish(Number(this.route.snapshot.paramMap.get('id'))).subscribe({next:v=>{this.dish.set(v);this.loadAllergens();},error:e=>this.error.set(e.status===404?'Plat introuvable.':'Chargement impossible.')});}
 loadAllergens(){const d=this.dish();if(!d)return;this.associationsLoading.set(true);forkJoin({all:this.api.adminAllergens(),linked:this.api.dishAllergens(d.id)}).subscribe({next:r=>{this.all.set(r.all);this.saved=new Set(r.linked.allergens.map(a=>a.id));this.selected=new Set(this.saved);this.associationsLoading.set(false);},error:()=>{this.message.set('Chargement des allergènes impossible.');this.associationsLoading.set(false);}});}
 select(id:number,name:string,event:Event){const checked=(event.target as HTMLInputElement).checked;if(!checked&&this.saved.has(id)&&!confirm(`Retirer ${name} du plat ?`)){(event.target as HTMLInputElement).checked=true;return;}if(checked)this.selected.add(id);else this.selected.delete(id);}
 changed(){return this.selected.size!==this.saved.size||[...this.selected].some(id=>!this.saved.has(id));}cancel(){this.selected=new Set(this.saved);this.message.set('Changements annulés.');}
 save(){const d=this.dish();if(!d||!this.changed()||this.saving())return;this.saving.set(true);this.api.setDishAllergens(d.id,[...this.selected]).subscribe({next:()=>{this.saving.set(false);this.message.set('Allergènes enregistrés.');this.load();},error:e=>{this.saving.set(false);this.message.set(e.error?.message??'Enregistrement impossible.');this.loadAllergens();}});}
 toggle(){const d=this.dish();if(!d||!confirm(`${d.active?'Désactiver':'Réactiver'} ce plat ?`))return;this.processing.set(true);this.api.enableDish(d.id,!d.active).subscribe({next:v=>{this.dish.set(v);this.processing.set(false);},error:()=>{this.error.set('Modification impossible.');this.processing.set(false);}});}
}

@Component({standalone:true,imports:[FormsModule,RouterLink],templateUrl: './admin-dish-form.html'})
export class AdminDishFormComponent{
 private api=inject(ManagementService);private route=inject(ActivatedRoute);private router=inject(Router);id=Number(this.route.snapshot.paramMap.get('id'))||0;submitting=signal(false);error=signal('');
 form:{name:string;description:string|null;type:Dish['type'];active:boolean}={name:'',description:null,type:'ENTRY',active:true};
 constructor(){if(this.id)this.api.adminDish(this.id).subscribe({next:d=>this.form={name:d.name,description:d.description,type:d.type,active:d.active},error:()=>this.error.set('Plat introuvable.')});}
 save(){this.submitting.set(true);this.error.set('');const request=this.id?this.api.updateAdminDish(this.id,this.form):this.api.createAdminDish(this.form);request.subscribe({next:d=>this.router.navigate(['/admin/plats',d.id]),error:e=>{this.error.set(e.error?.message??'Enregistrement impossible.');this.submitting.set(false);}});}
}
