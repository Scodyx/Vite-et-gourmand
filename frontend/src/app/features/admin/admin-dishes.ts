import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Dish, ManagementService } from '../../core/services/management.service';
import { forkJoin } from 'rxjs';

const labels:Record<string,string>={ENTRY:'Entrée',MAIN_COURSE:'Plat principal',DESSERT:'Dessert'};

@Component({standalone:true,imports:[FormsModule,RouterLink],template:`
<section class="container section"><div class="section-heading"><h1>Plats</h1><div><button class="button secondary small" (click)="load()">Actualiser</button> <a class="button small" routerLink="/admin/plats/nouveau">Nouveau plat</a></div></div>
<div class="two"><label>Rechercher<input [(ngModel)]="search" name="search"></label><label>État<select [(ngModel)]="activeFilter" name="active"><option value="">Tous</option><option value="true">Actifs</option><option value="false">Inactifs</option></select></label>
<label>Catégorie<select [(ngModel)]="typeFilter" name="type"><option value="">Toutes</option><option value="ENTRY">Entrée</option><option value="MAIN_COURSE">Plat principal</option><option value="DESSERT">Dessert</option></select></label></div>
@if(loading()){<p role="status">Chargement…</p>}@else if(error()){<p class="alert" role="alert">{{error()}}</p>}@else{<div class="cards">@for(d of filtered();track d.id){<article class="card"><h2>{{d.name}}</h2><p>{{d.description||'Aucune description.'}}</p>
<span class="tag">{{label(d.type)}}</span> <span class="tag">{{d.active?'Actif':'Inactif'}}</span><p>{{d.menuCount}} menu(s) associé(s)</p><a [routerLink]="['/admin/plats',d.id]">Consulter</a> · <a [routerLink]="['/admin/plats',d.id,'modifier']">Modifier</a></article>}@empty{<p>Aucun plat.</p>}</div>}</section>`})
export class AdminDishListComponent{
 private api=inject(ManagementService);dishes=signal<Dish[]>([]);loading=signal(true);error=signal('');search='';activeFilter='';typeFilter='';label=(v:string)=>labels[v]??v;
 filtered=computed(()=>{const q=this.search.trim().toLowerCase();return this.dishes().filter(d=>(!q||d.name.toLowerCase().includes(q))&&(!this.activeFilter||String(d.active)===this.activeFilter)&&(!this.typeFilter||d.type===this.typeFilter)).sort((a,b)=>a.name.localeCompare(b.name));});
 constructor(){this.load();}load(){this.loading.set(true);this.api.adminDishes().subscribe({next:v=>{this.dishes.set(v);this.loading.set(false);},error:()=>{this.error.set('Impossible de charger les plats.');this.loading.set(false);}});}
}

@Component({standalone:true,imports:[FormsModule,RouterLink],template:`
<section class="container section">@if(dish();as d){<a routerLink="/admin/plats">Retour aux plats</a><h1>{{d.name}}</h1><p>{{d.description||'Aucune description.'}}</p><p><span class="tag">{{label(d.type)}}</span> <span class="tag">{{d.active?'Actif':'Inactif'}}</span></p>
<h2>Associations en lecture seule</h2><p>{{d.menuCount}} menu(s) utilise(nt) ce plat.</p><p>Allergènes : @for(a of d.allergens;track a.id){<span class="tag">{{a.name}}</span>}@empty{aucun}</p>
<a class="button" [routerLink]="['/admin/plats',d.id,'modifier']">Modifier</a> <button class="button secondary" [disabled]="processing()" (click)="toggle()">{{d.active?'Désactiver':'Réactiver'}}</button>
<section class="card"><h2>Allergènes · {{selected.size}}</h2><label>Rechercher<input [(ngModel)]="search" name="allergenSearch"></label>
@if(associationsLoading()){<p role="status">Chargement…</p>}@else{<div class="cards">@for(a of filtered();track a.id){<label class="card check"><input type="checkbox" [checked]="selected.has(a.id)" (change)="select(a.id,a.name,$event)">{{a.name}}</label>}@empty{<p>Aucun allergène.</p>}</div>
<button class="button" [disabled]="saving()||!changed()" (click)="save()">Enregistrer les allergènes</button> <button class="button secondary" [disabled]="saving()||!changed()" (click)="cancel()">Annuler</button>}
@if(message()){<p class="alert" aria-live="polite">{{message()}}</p>}</section>
}@else if(error()){<p class="alert" role="alert">{{error()}}</p>}@else{<p role="status">Chargement…</p>}</section>`})
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

@Component({standalone:true,imports:[FormsModule,RouterLink],template:`
<section class="container section"><a routerLink="/admin/plats">Retour aux plats</a><h1>{{id?'Modifier le plat':'Créer un plat'}}</h1><form class="form-card" (ngSubmit)="save()" #f="ngForm">
<label>Nom<input [(ngModel)]="form.name" name="name" required maxlength="160"></label><label>Description<textarea [(ngModel)]="form.description" name="description" maxlength="2000"></textarea></label>
<label>Catégorie<select [(ngModel)]="form.type" name="type" required><option value="ENTRY">Entrée</option><option value="MAIN_COURSE">Plat principal</option><option value="DESSERT">Dessert</option></select></label>
<label class="check"><input type="checkbox" [(ngModel)]="form.active" name="active">Actif</label><button class="button" [disabled]="f.invalid||submitting()">Enregistrer</button>@if(error()){<p class="alert" role="alert">{{error()}}</p>}</form></section>`})
export class AdminDishFormComponent{
 private api=inject(ManagementService);private route=inject(ActivatedRoute);private router=inject(Router);id=Number(this.route.snapshot.paramMap.get('id'))||0;submitting=signal(false);error=signal('');
 form:{name:string;description:string|null;type:Dish['type'];active:boolean}={name:'',description:null,type:'ENTRY',active:true};
 constructor(){if(this.id)this.api.adminDish(this.id).subscribe({next:d=>this.form={name:d.name,description:d.description,type:d.type,active:d.active},error:()=>this.error.set('Plat introuvable.')});}
 save(){this.submitting.set(true);this.error.set('');const request=this.id?this.api.updateAdminDish(this.id,this.form):this.api.createAdminDish(this.form);request.subscribe({next:d=>this.router.navigate(['/admin/plats',d.id]),error:e=>{this.error.set(e.error?.message??'Enregistrement impossible.');this.submitting.set(false);}});}
}
