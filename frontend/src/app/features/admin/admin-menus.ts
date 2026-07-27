import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminMenu, Dish, ManagementService } from '../../core/services/management.service';
import { forkJoin } from 'rxjs';

@Component({standalone:true,imports:[CommonModule,FormsModule,RouterLink],template:`
<section class="container section"><div class="section-heading"><h1>Menus</h1><div><button class="button secondary small" (click)="load()">Actualiser</button> <a class="button small" routerLink="/admin/menus/nouveau">Nouveau menu</a></div></div>
<div class="two"><label>Rechercher<input [(ngModel)]="search" name="search"></label><label>État<select [(ngModel)]="activeFilter" name="active"><option value="">Tous</option><option value="true">Actifs</option><option value="false">Inactifs</option></select></label>
<label>Trier<select [(ngModel)]="sort" name="sort"><option value="title">Nom</option><option value="basePrice">Prix</option><option value="availableStock">Stock</option></select></label></div>
@if(loading()){<p role="status">Chargement…</p>}@else if(error()){<p class="alert" role="alert">{{error()}}</p>}@else{
<div class="cards">@for(m of filtered();track m.id){<article class="card">@if(m.imageUrl){<img [src]="m.imageUrl" [alt]="'Présentation de '+m.title" (error)="imageError($event)">}<h2>{{m.title}}</h2>
<p class="price">{{m.basePrice|currency:'EUR'}}</p><p>Minimum {{m.minimumPersons}} personnes · Stock disponible : {{m.availableStock}} personnes</p><span class="tag">{{m.active?'Actif':'Inactif'}}</span>
<p>Mis à jour le {{m.updatedAt|date:'dd/MM/yyyy HH:mm'}}</p><a [routerLink]="['/admin/menus',m.id]">Consulter</a> · <a [routerLink]="['/admin/menus',m.id,'modifier']">Modifier</a></article>}@empty{<p>Aucun menu.</p>}</div>}</section>`})
export class AdminMenuListComponent{
 private api=inject(ManagementService);menus=signal<AdminMenu[]>([]);loading=signal(true);error=signal('');search='';activeFilter='';sort='title';
 filtered=computed(()=>{const q=this.search.trim().toLowerCase();return this.menus().filter(m=>(!q||m.title.toLowerCase().includes(q))&&(!this.activeFilter||String(m.active)===this.activeFilter)).sort((a,b)=>this.sort==='title'?a.title.localeCompare(b.title):(a[this.sort as 'basePrice'|'availableStock']-b[this.sort as 'basePrice'|'availableStock']));});
 constructor(){this.load();}load(){this.loading.set(true);this.api.menus().subscribe({next:v=>{this.menus.set(v);this.loading.set(false);},error:()=>{this.error.set('Impossible de charger les menus.');this.loading.set(false);}});}imageError(event:Event){const image=event.target as HTMLImageElement;if(!image.src.endsWith('/menu-placeholder.svg'))image.src='/menu-placeholder.svg';}
}

@Component({standalone:true,imports:[CommonModule,FormsModule,RouterLink],template:`
<section class="container section">@if(menu();as m){<a routerLink="/admin/menus">Retour aux menus</a><h1>{{m.title}}</h1>@if(m.imageUrl){<img [src]="m.imageUrl" [alt]="'Présentation de '+m.title" (error)="imageError($event)">}
<p>{{m.description}}</p><dl><dt>Prix</dt><dd>{{m.basePrice|currency:'EUR'}}</dd><dt>Minimum</dt><dd>{{m.minimumPersons}} personnes</dd><dt>Stock</dt><dd>{{m.availableStock}} personnes</dd><dt>État</dt><dd>{{m.active?'Actif':'Inactif'}}</dd></dl>
<a class="button" [routerLink]="['/admin/menus',m.id,'modifier']">Modifier</a> <button class="button secondary" [disabled]="processing()" (click)="toggle()">{{m.active?'Désactiver':'Réactiver'}}</button>
<section class="card"><div class="section-heading"><h2>Composition · {{selected.size}} plat(s)</h2><button class="button secondary small" type="button" (click)="loadDishes()">Actualiser</button></div>
<div class="two"><label>Rechercher<input [(ngModel)]="dishSearch" name="dishSearch"></label><label>Type<select [(ngModel)]="dishType" name="dishType"><option value="">Tous</option><option value="ENTRY">Entrée</option><option value="MAIN_COURSE">Plat principal</option><option value="DESSERT">Dessert</option></select></label></div>
@if(dishesLoading()){<p role="status">Chargement des plats…</p>}@else{
<div class="cards">@for(d of filteredDishes();track d.id){<label class="card check"><input type="checkbox" [checked]="selected.has(d.id)" [disabled]="!d.active&&!selected.has(d.id)" (change)="select(d,$event)">
<strong>{{d.name}}</strong> <span class="tag">{{typeLabel(d.type)}}</span> <span class="tag">{{d.active?'Actif':'Inactif'}}</span></label>}@empty{<p>Aucun plat correspondant.</p>}</div>
<button class="button" type="button" [disabled]="associationSaving()||!changed()" (click)="saveDishes()">Enregistrer la composition</button>
<button class="button secondary" type="button" [disabled]="associationSaving()||!changed()" (click)="cancelDishes()">Annuler les changements</button>}
@if(associationMessage()){<p class="alert" aria-live="polite">{{associationMessage()}}</p>}</section>
}@else if(error()){<p class="alert" role="alert">{{error()}}</p>}@else{<p role="status">Chargement…</p>}</section>`})
export class AdminMenuDetailComponent{
 private api=inject(ManagementService);private route=inject(ActivatedRoute);menu=signal<AdminMenu|null>(null);error=signal('');processing=signal(false);
 allDishes=signal<Dish[]>([]);dishesLoading=signal(true);associationSaving=signal(false);associationMessage=signal('');selected=new Set<number>();private saved=new Set<number>();dishSearch='';dishType='';typeLabel=(v:string)=>({ENTRY:'Entrée',MAIN_COURSE:'Plat principal',DESSERT:'Dessert'}[v]??v);
 filteredDishes(){const q=this.dishSearch.trim().toLowerCase();return this.allDishes().filter(d=>(!q||d.name.toLowerCase().includes(q))&&(!this.dishType||d.type===this.dishType)).sort((a,b)=>a.type.localeCompare(b.type)||a.name.localeCompare(b.name));}
 constructor(){this.load();}load(){this.api.menu(Number(this.route.snapshot.paramMap.get('id'))).subscribe({next:v=>{this.menu.set(v);this.loadDishes();},error:e=>this.error.set(e.status===404?'Menu introuvable.':'Chargement impossible.')});}
 loadDishes(){const m=this.menu();if(!m)return;this.dishesLoading.set(true);forkJoin({all:this.api.adminDishes(),linked:this.api.menuDishes(m.id)}).subscribe({next:r=>{this.allDishes.set(r.all);this.saved=new Set(r.linked.dishes.map(d=>d.id));this.selected=new Set(this.saved);this.dishesLoading.set(false);this.associationMessage.set('');},error:()=>{this.associationMessage.set('Impossible de charger la composition.');this.dishesLoading.set(false);}});}
 select(d:Dish,event:Event){const checked=(event.target as HTMLInputElement).checked;if(!checked&&this.saved.has(d.id)&&!confirm(`Retirer ${d.name} du menu ?`)){(event.target as HTMLInputElement).checked=true;return;}if(checked)this.selected.add(d.id);else this.selected.delete(d.id);}
 changed(){return this.selected.size!==this.saved.size||[...this.selected].some(id=>!this.saved.has(id));}
 cancelDishes(){this.selected=new Set(this.saved);this.associationMessage.set('Changements annulés.');}
 saveDishes(){const m=this.menu();if(!m||!this.changed()||this.associationSaving())return;this.associationSaving.set(true);this.associationMessage.set('');
  this.api.setMenuDishes(m.id,[...this.selected]).subscribe({next:()=>{this.associationSaving.set(false);this.associationMessage.set('Composition enregistrée.');this.loadDishes();},error:e=>{this.associationSaving.set(false);this.associationMessage.set(e.error?.message??'Enregistrement impossible.');this.loadDishes();}});}
 toggle(){const m=this.menu();if(!m||!confirm(`${m.active?'Désactiver':'Réactiver'} ce menu ?`))return;this.processing.set(true);this.api.enableMenu(m.id,!m.active).subscribe({next:v=>{this.menu.set(v);this.processing.set(false);},error:()=>{this.error.set('Modification impossible.');this.processing.set(false);}});}imageError(e:Event){const image=e.target as HTMLImageElement;if(!image.src.endsWith('/menu-placeholder.svg'))image.src='/menu-placeholder.svg';}
}

@Component({standalone:true,imports:[FormsModule,RouterLink],template:`
<section class="container section"><a routerLink="/admin/menus">Retour aux menus</a><h1>{{id?'Modifier le menu':'Créer un menu'}}</h1>
<form class="form-card wide" (ngSubmit)="save()" #f="ngForm"><div class="two"><label>Nom<input [(ngModel)]="form.title" name="title" required></label>
<label>Prix par personne<input type="number" step="0.01" min="0.01" [(ngModel)]="form.basePrice" name="price" required></label><label>Minimum de personnes<input type="number" min="1" [(ngModel)]="form.minimumPersons" name="minimum" required></label>
<label>Stock disponible (personnes)<input type="number" min="0" [(ngModel)]="form.availableStock" name="stock" required></label><label>Thème<input [(ngModel)]="form.theme" name="theme" required></label>
<label>Régime<input [(ngModel)]="form.diet" name="diet" required></label><label>URL de l’image<input type="url" [(ngModel)]="form.imageUrl" name="image"></label><label class="check"><input type="checkbox" [(ngModel)]="form.active" name="active">Actif</label></div>
<label>Description<textarea [(ngModel)]="form.description" name="description" required></textarea></label><label>Conditions<textarea [(ngModel)]="form.conditions" name="conditions" required></textarea></label>
@if(form.imageUrl){<img [src]="form.imageUrl" alt="Aperçu du menu" (error)="imageError($event)">}<button class="button" [disabled]="f.invalid||submitting()">Enregistrer</button>
@if(error()){<p class="alert" role="alert">{{error()}}</p>}</form></section>`})
export class AdminMenuFormComponent{
 private api=inject(ManagementService);private route=inject(ActivatedRoute);private router=inject(Router);id=Number(this.route.snapshot.paramMap.get('id'))||0;submitting=signal(false);error=signal('');
 form={title:'',description:'',conditions:'',minimumPersons:1,basePrice:0.01,availableStock:0,active:true,theme:'',diet:'',imageUrl:null as string|null};
 constructor(){if(this.id)this.api.menu(this.id).subscribe({next:m=>this.form={title:m.title,description:m.description,conditions:m.conditions,minimumPersons:m.minimumPersons,basePrice:m.basePrice,availableStock:m.availableStock,active:m.active,theme:m.theme,diet:m.diet,imageUrl:m.imageUrl},error:()=>this.error.set('Menu introuvable.')});}
 save(){this.submitting.set(true);this.error.set('');const request=this.id?this.api.updateMenu(this.id,this.form):this.api.createMenu(this.form);request.subscribe({next:m=>this.router.navigate(['/admin/menus',m.id]),error:e=>{this.error.set(e.error?.message??'Enregistrement impossible.');this.submitting.set(false);}});}imageError(e:Event){const image=e.target as HTMLImageElement;if(!image.src.endsWith('/menu-placeholder.svg'))image.src='/menu-placeholder.svg';}
}
