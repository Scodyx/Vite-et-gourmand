import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
const PASSWORD=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/;
@Component({
 standalone:true,selector:'app-register',imports:[ReactiveFormsModule,RouterLink],
 templateUrl: './register.html'
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
