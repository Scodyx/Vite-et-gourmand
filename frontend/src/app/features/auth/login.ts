import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
@Component({
 standalone: true, selector: 'app-login', imports: [ReactiveFormsModule, RouterLink],
 template: `<section class="form-page"><form class="form-card" [formGroup]="form" (ngSubmit)="submit()"><p class="eyebrow">Bon retour</p><h1>Connexion</h1>
 <label>Adresse e-mail<input type="email" formControlName="email" autocomplete="email"></label>
 <label>Mot de passe<input type="password" formControlName="password" autocomplete="current-password"></label>
 @if (error()) {<p class="alert error" role="alert">{{error()}}</p>}
 <button class="button" [disabled]="form.invalid || loading()">{{loading() ? 'Connexion…' : 'Se connecter'}}</button>
 <p><a routerLink="/mot-de-passe-oublie">Mot de passe oublié ?</a></p><p>Pas encore de compte ? <a routerLink="/inscription">S’inscrire</a></p></form></section>`
})
export class LoginComponent {
 readonly loading=signal(false); readonly error=signal('');
 private readonly fb=inject(FormBuilder);private readonly auth=inject(AuthService);private readonly router=inject(Router);private readonly route=inject(ActivatedRoute);
 readonly form=this.fb.nonNullable.group({email:['',[Validators.required,Validators.email]],password:['',Validators.required]});
 submit(){if(this.form.invalid)return;this.loading.set(true);this.error.set('');this.auth.login(this.form.getRawValue()).subscribe({
  next:()=>this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl')||'/espace'),
  error:()=>{this.error.set('Adresse e-mail ou mot de passe incorrect.');this.loading.set(false);}
 });}
}
