import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminMenu, Dish, ManagementService } from '../../core/services/management.service';
import { forkJoin } from 'rxjs';

@Component({standalone:true,imports:[CommonModule,FormsModule,RouterLink],templateUrl: './admin-menu-list.html'})
export class AdminMenuListComponent{
 private api=inject(ManagementService);menus=signal<AdminMenu[]>([]);loading=signal(true);error=signal('');search='';activeFilter='';sort='title';
 filtered=computed(()=>{const q=this.search.trim().toLowerCase();return this.menus().filter(m=>(!q||m.title.toLowerCase().includes(q))&&(!this.activeFilter||String(m.active)===this.activeFilter)).sort((a,b)=>this.sort==='title'?a.title.localeCompare(b.title):(a[this.sort as 'basePrice'|'availableStock']-b[this.sort as 'basePrice'|'availableStock']));});
 constructor(){this.load();}load(){this.loading.set(true);this.api.menus().subscribe({next:v=>{this.menus.set(v);this.loading.set(false);},error:()=>{this.error.set('Impossible de charger les menus.');this.loading.set(false);}});}imageError(event:Event){const image=event.target as HTMLImageElement;if(!image.src.endsWith('/menu-placeholder.svg'))image.src='/menu-placeholder.svg';}
}

@Component({standalone:true,imports:[CommonModule,FormsModule,RouterLink],templateUrl: './admin-menu-detail.html'})
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

@Component({standalone:true,imports:[FormsModule,RouterLink],templateUrl: './admin-menu-form.html'})
export class AdminMenuFormComponent{
 private api=inject(ManagementService);private route=inject(ActivatedRoute);private router=inject(Router);id=Number(this.route.snapshot.paramMap.get('id'))||0;submitting=signal(false);error=signal('');
 form={title:'',description:'',conditions:'',minimumPersons:1,basePrice:0.01,availableStock:0,active:true,theme:'',diet:'',imageUrl:null as string|null};
 constructor(){if(this.id)this.api.menu(this.id).subscribe({next:m=>this.form={title:m.title,description:m.description,conditions:m.conditions,minimumPersons:m.minimumPersons,basePrice:m.basePrice,availableStock:m.availableStock,active:m.active,theme:m.theme,diet:m.diet,imageUrl:m.imageUrl},error:()=>this.error.set('Menu introuvable.')});}
 save(){this.submitting.set(true);this.error.set('');const request=this.id?this.api.updateMenu(this.id,this.form):this.api.createMenu(this.form);request.subscribe({next:m=>this.router.navigate(['/admin/menus',m.id]),error:e=>{this.error.set(e.error?.message??'Enregistrement impossible.');this.submitting.set(false);}});}imageError(e:Event){const image=e.target as HTMLImageElement;if(!image.src.endsWith('/menu-placeholder.svg'))image.src='/menu-placeholder.svg';}
}
