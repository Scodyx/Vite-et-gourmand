import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
const PASSWORD=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/;
@Component({
 standalone:true,selector:'app-register',imports:[ReactiveFormsModule,RouterLink],
 template:`<section class="form-page"><form class="form-card wide" [formGroup]="form" (ngSubmit)="submit()"><p class="eyebrow">Votre espace</p><h1>Créer un compte</h1>
 <div class="two"><label>Prénom<input formControlName="firstName" autocomplete="given-name"></label><label>Nom<input formControlName="lastName" autocomplete="family-name"></label>
 <label>Téléphone<input formControlName="phone" autocomplete="tel"></label><label>Adresse e-mail<input type="email" formControlName="email" autocomplete="email"></label>
 <label class="full">Adresse<input formControlName="addressLine" autocomplete="street-address"></label><label>Code postal<input formControlName="postalCode" autocomplete="postal-code"></label>
 <label>Ville<input formControlName="city" autocomplete="address-level2"></label><label>Pays<input formControlName="country" autocomplete="country-name"></label>
 <label>Mot de passe<input type="password" formControlName="password" autocomplete="new-password"><small>10 caractères, majuscule, minuscule, chiffre et caractère spécial.</small></label>
 <label>Confirmation<input type="password" formControlName="confirmation" autocomplete="new-password"></label></div>
 <label class="check"><input type="checkbox" formControlName="termsAccepted"> J’accepte les <a routerLink="/conditions">conditions et la politique de confidentialité</a>.</label>
 @if(form.errors?.['passwordMismatch']&&form.controls.confirmation.touched){<p class="field-error">Les mots de passe diffèrent.</p>}
 @if(error()){<p class="alert error" role="alert">{{error()}}</p>}<button class="button" [disabled]="form.invalid||loading()">Créer mon compte</button></form></section>`
})
export class RegisterComponent {
 readonly loading=signal(false);readonly error=signal('');
 private readonly fb=inject(FormBuilder);private readonly auth=inject(AuthService);private readonly router=inject(Router);
 readonly form=this.fb.nonNullable.group({
  firstName:['',Validators.required],lastName:['',Validators.required],phone:['',Validators.required],
  email:['',[Validators.required,Validators.email]],addressLine:['',Validators.required],postalCode:['',Validators.required],
  city:['Bordeaux',Validators.required],country:['France',Validators.required],password:['',[Validators.required,Validators.pattern(PASSWORD)]],
  confirmation:['',Validators.required],termsAccepted:[false,Validators.requiredTrue]
 },{validators:g=>g.get('password')?.value===g.get('confirmation')?.value?null:{passwordMismatch:true}});
 submit(){if(this.form.invalid)return;this.loading.set(true);const{confirmation,...payload}=this.form.getRawValue();this.auth.register(payload).subscribe({
  next:()=>this.router.navigateByUrl('/espace'),error:()=>{this.error.set('Impossible de créer le compte. Vérifiez les informations.');this.loading.set(false);}
 });}
}
