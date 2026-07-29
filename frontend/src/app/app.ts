import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { BusinessService, OpeningHours } from './core/services/business.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly hours=signal<OpeningHours[]>([]);
  protected readonly navigationOpen=signal(false);
  protected readonly administrationOpen=signal(false);
  constructor(protected readonly auth: AuthService, business:BusinessService) {
    business.publicHours().subscribe({next:value=>this.hours.set(value),error:()=>this.hours.set([])});
  }
  protected toggleNavigation(){this.navigationOpen.update(value=>!value);}
  protected toggleAdministration(){this.administrationOpen.update(value=>!value);}
  protected closeNavigation(){this.navigationOpen.set(false);this.administrationOpen.set(false);}
  @HostListener('document:click',['$event'])
  protected closeAdministrationOnOutsideClick(event:MouseEvent){
    if(!(event.target as HTMLElement).closest('.admin-menu'))this.administrationOpen.set(false);
  }
  @HostListener('document:keydown.escape')
  protected closeAdministrationOnEscape(){this.administrationOpen.set(false);}
  protected day(value:string){return ({MONDAY:'Lundi',TUESDAY:'Mardi',WEDNESDAY:'Mercredi',THURSDAY:'Jeudi',FRIDAY:'Vendredi',SATURDAY:'Samedi',SUNDAY:'Dimanche'} as Record<string,string>)[value]??value;}
}
