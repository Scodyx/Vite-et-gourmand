import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({standalone:true,imports:[ReactiveFormsModule],template:`<section class="form-page"><form class="form-card" [formGroup]="form" (ngSubmit)="send()"><p class="eyebrow">Échangeons</p><h1>Contact</h1><label>Titre<input formControlName="title"></label><label>Adresse e-mail<input type="email" formControlName="email"></label><label>Votre message<textarea formControlName="message" rows="7"></textarea></label><button class="button" [disabled]="form.invalid||loading()">Envoyer</button>@if(message()){<p class="alert" role="status">{{message()}}</p>}</form></section>`})
export class ContactComponent{
 readonly loading=signal(false);readonly message=signal('');
 private readonly fb=inject(FormBuilder);private readonly http=inject(HttpClient);
 form=this.fb.nonNullable.group({title:['',Validators.required],email:['',[Validators.required,Validators.email]],message:['',[Validators.required,Validators.minLength(10)]]});
 send(){if(this.form.invalid)return;this.loading.set(true);this.http.post(`${environment.apiUrl}/public/contact`,this.form.getRawValue()).subscribe({
  next:()=>{this.message.set('Votre message a bien été transmis.');this.form.reset();this.loading.set(false);},
  error:()=>{this.message.set('L’envoi a échoué. Réessayez plus tard.');this.loading.set(false);}
 });}
}
@Component({standalone:true,imports:[ReactiveFormsModule],template:`<section class="form-page"><form class="form-card" [formGroup]="form" (ngSubmit)="send()"><h1>Mot de passe oublié</h1><p>Si le compte existe, un lien temporaire sera envoyé.</p><label>Adresse e-mail<input type="email" formControlName="email"></label><button class="button" [disabled]="form.invalid">Envoyer</button>@if(message()){<p class="alert">{{message()}}</p>}</form></section>`})
export class ForgotPasswordComponent{
 private fb=inject(FormBuilder);private http=inject(HttpClient);message=signal('');
 form=this.fb.nonNullable.group({email:['',[Validators.required,Validators.email]]});
 send(){this.http.post(`${environment.apiUrl}/auth/forgot-password`,this.form.getRawValue()).subscribe({next:()=>this.message.set('Si cette adresse est connue, le message a été envoyé.'),error:()=>this.message.set('Le service est momentanément indisponible.')});}
}
@Component({standalone:true,imports:[ReactiveFormsModule],template:`<section class="form-page"><form class="form-card" [formGroup]="form" (ngSubmit)="send()"><h1>Réinitialiser le mot de passe</h1><label>Nouveau mot de passe<input type="password" formControlName="password"></label><small>12 caractères minimum, avec majuscule, minuscule, chiffre et symbole.</small><button class="button" [disabled]="form.invalid">Enregistrer</button>@if(message()){<p class="alert">{{message()}}</p>}</form></section>`})
export class ResetPasswordComponent{
 private fb=inject(FormBuilder);private http=inject(HttpClient);private route=inject(ActivatedRoute);message=signal('');
 form=this.fb.nonNullable.group({password:['',[Validators.required,Validators.minLength(12)]]});
 send(){this.http.post(`${environment.apiUrl}/auth/reset-password`,{token:this.route.snapshot.queryParamMap.get('token'),...this.form.getRawValue()}).subscribe({next:()=>this.message.set('Mot de passe modifié. Vous pouvez vous connecter.'),error:e=>this.message.set(e.error?.message??'Le lien est invalide ou expiré.')});}
}
@Component({standalone:true,template:`<article class="container legal section"><h1>Mentions légales</h1><h2>Éditeur</h2><p>Vite & Gourmand, entreprise fictive créée dans le cadre d’une évaluation de formation. Les coordonnées affichées sont des données de démonstration.</p><h2>Hébergement et propriété intellectuelle</h2><p>Les informations de l’hébergeur seront complétées avant déploiement. Les contenus et créations graphiques ne peuvent être réutilisés sans autorisation.</p></article>`})
export class LegalNoticeComponent{}
@Component({standalone:true,template:`<article class="container legal section"><h1>Conditions générales et confidentialité</h1><h2>Commandes</h2><p>Les prix sont recalculés par le serveur. Une remise de 10 % s’applique à partir de cinq personnes supplémentaires. Hors Bordeaux : 5 € + 0,59 €/km.</p><h2>Matériel</h2><p>Le matériel prêté doit être restitué sous dix jours ouvrés. Des frais contractuels de 600 € peuvent s’appliquer.</p><h2>Données personnelles</h2><p>Les données sont limitées à la gestion des comptes, commandes et demandes. Leur durée de conservation est configurable. Vous pouvez demander l’accès ou la rectification de vos données.</p></article>`})
export class TermsComponent{}
@Component({standalone:true,imports:[RouterLink],template:`<section class="empty"><h1>Accès interdit</h1><p>Votre rôle ne permet pas d’accéder à cette page.</p><a routerLink="/" class="button">Retour à l’accueil</a></section>`})
export class ForbiddenComponent{}
@Component({standalone:true,imports:[RouterLink],template:`<section class="empty"><h1>Page introuvable</h1><p>Cette page n’existe pas ou a été déplacée.</p><a routerLink="/" class="button">Retour à l’accueil</a></section>`})
export class NotFoundComponent{}
