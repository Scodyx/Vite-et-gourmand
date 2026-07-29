import { Component,OnInit,signal } from '@angular/core';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MenuDetail } from '../../core/models/menu';
import { MenuService } from '../../core/services/menu.service';
@Component({standalone:true,selector:'app-menu-detail',imports:[RouterLink],templateUrl: './menu-detail.html',styleUrl:'./menu-detail.scss'})
export class MenuDetailComponent implements OnInit{
 readonly menu=signal<MenuDetail|null>(null);readonly error=signal('');
 constructor(private route:ActivatedRoute,private api:MenuService){}
 ngOnInit(){this.api.detail(this.route.snapshot.paramMap.get('slug')!).subscribe({next:m=>this.menu.set(m),error:()=>this.error.set('Ce menu est introuvable ou indisponible.')});}
 label(type:string){return ({ENTRY:'Entrée',MAIN_COURSE:'Plat',DESSERT:'Dessert'} as Record<string,string>)[type]??type;}
}
