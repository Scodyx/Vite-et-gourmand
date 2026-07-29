import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({standalone:true,imports:[ReactiveFormsModule],templateUrl: './contact.html'})
export class ContactComponent{
 readonly loading=signal(false);readonly message=signal('');
 private readonly fb=inject(FormBuilder);private readonly http=inject(HttpClient);
 form=this.fb.nonNullable.group({title:['',Validators.required],email:['',[Validators.required,Validators.email]],message:['',[Validators.required,Validators.minLength(10)]]});
 send(){if(this.form.invalid)return;this.loading.set(true);this.http.post(`${environment.apiUrl}/public/contact`,this.form.getRawValue()).subscribe({
  next:()=>{this.message.set('Votre message a bien été transmis.');this.form.reset();this.loading.set(false);},
  error:()=>{this.message.set('L’envoi a échoué. Réessayez plus tard.');this.loading.set(false);}
 });}
}
@Component({standalone:true,imports:[ReactiveFormsModule],templateUrl: './forgot-password.html'})
export class ForgotPasswordComponent{
 private fb=inject(FormBuilder);private http=inject(HttpClient);message=signal('');
 form=this.fb.nonNullable.group({email:['',[Validators.required,Validators.email]]});
 send(){this.http.post(`${environment.apiUrl}/auth/forgot-password`,this.form.getRawValue()).subscribe({next:()=>this.message.set('Si cette adresse est connue, le message a été envoyé.'),error:()=>this.message.set('Le service est momentanément indisponible.')});}
}
@Component({standalone:true,imports:[ReactiveFormsModule],templateUrl: './reset-password.html'})
export class ResetPasswordComponent{
 private fb=inject(FormBuilder);private http=inject(HttpClient);private route=inject(ActivatedRoute);message=signal('');
 form=this.fb.nonNullable.group({password:['',[Validators.required,Validators.minLength(12)]]});
 send(){this.http.post(`${environment.apiUrl}/auth/reset-password`,{token:this.route.snapshot.queryParamMap.get('token'),...this.form.getRawValue()}).subscribe({next:()=>this.message.set('Mot de passe modifié. Vous pouvez vous connecter.'),error:e=>this.message.set(e.error?.message??'Le lien est invalide ou expiré.')});}
}
@Component({standalone:true,templateUrl: './legal-notice.html'})
export class LegalNoticeComponent{}
@Component({standalone:true,templateUrl: './terms.html'})
export class TermsComponent{}
@Component({standalone:true,imports:[RouterLink],templateUrl: './forbidden.html'})
export class ForbiddenComponent{}
@Component({standalone:true,imports:[RouterLink],templateUrl: './not-found.html'})
export class NotFoundComponent{}
