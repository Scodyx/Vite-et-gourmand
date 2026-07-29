import { Component,OnInit,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Menu } from '../../core/models/menu';
import { MenuService } from '../../core/services/menu.service';
@Component({standalone:true,selector:'app-menu-list',imports:[FormsModule,RouterLink],templateUrl: './menu-list.html'})
export class MenuListComponent implements OnInit{
 readonly menus=signal<Menu[]>([]);readonly error=signal('');readonly loading=signal(false);
 query='';maxPrice:number|null=null;theme='';diet='';
 constructor(private api:MenuService){}ngOnInit(){this.load();}
 load(){this.loading.set(true);this.error.set('');this.api.list({query:this.query,maxPrice:this.maxPrice??undefined,theme:this.theme,diet:this.diet}).subscribe({
  next:p=>{this.menus.set(p.content);this.loading.set(false);},error:()=>{this.error.set('Les menus sont momentanément indisponibles.');this.loading.set(false);}});}
}
