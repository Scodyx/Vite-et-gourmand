import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BusinessService } from '../../core/services/business.service';
import { OrderDetail, OrderUpdate } from '../../core/models/order';
import { orderStatusLabel } from '../../core/models/order-status';
import { OrderService } from '../../core/services/order.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './order-detail.html'
})
export class OrderDetailComponent {
  private readonly route=inject(ActivatedRoute);private readonly orders=inject(OrderService);
  private readonly business=inject(BusinessService);private readonly fb=inject(FormBuilder);
  @ViewChild('cancelReason') cancelReason?:ElementRef<HTMLTextAreaElement>;
  readonly detail=signal<OrderDetail|null>(null);readonly loading=signal(true);readonly error=signal('');
  readonly errorTitle=signal('Commande indisponible');readonly actionError=signal('');readonly success=signal('');
  readonly editing=signal(false);readonly cancelling=signal(false);readonly submitting=signal(false);
  readonly editForm=this.fb.nonNullable.group({
    personCount:[1,[Validators.required,Validators.min(1)]],prestationDate:['',Validators.required],
    desiredDeliveryTime:['',Validators.required],deliveryAddress:['',Validators.required],
    deliveryPostalCode:['',Validators.required],deliveryCity:['',Validators.required],
    deliveryCountry:['',Validators.required],distanceKm:[0,[Validators.required,Validators.min(0)]]
  });
  readonly cancelForm=this.fb.nonNullable.group({reason:['',[Validators.required,Validators.minLength(3)]]});
  readonly reviewForm=this.fb.nonNullable.group({
    rating:[5,[Validators.required,Validators.min(1),Validators.max(5)]],
    comment:['',[Validators.required,Validators.minLength(10),Validators.maxLength(2000)]]
  });
  constructor(){this.load();}
  statusLabel=orderStatusLabel;
  load(message=''){const id=Number(this.route.snapshot.paramMap.get('id'));this.loading.set(true);this.error.set('');
    this.orders.detail(id).subscribe({next:data=>{this.detail.set(data);this.loading.set(false);this.success.set(message);},
      error:e=>{this.loading.set(false);this.errorTitle.set(e.status===404?'Commande introuvable':e.status===403?'Accès interdit':'Commande indisponible');
        this.error.set(e.status===0?'Le service est injoignable.':'Cette commande ne peut pas être affichée.');}});}
  openEdit(){const o=this.detail()!.order;this.editForm.setValue({personCount:o.personCount,prestationDate:o.prestationDate,
    desiredDeliveryTime:o.desiredDeliveryTime.slice(0,5),deliveryAddress:o.deliveryAddress,deliveryPostalCode:o.deliveryPostalCode,
    deliveryCity:o.deliveryCity,deliveryCountry:o.deliveryCountry,distanceKm:o.distanceKm});this.actionError.set('');this.editing.set(true);}
  saveEdit(){if(this.editForm.invalid||this.submitting())return;this.submitting.set(true);this.actionError.set('');
    this.orders.update(this.detail()!.order.id,this.editForm.getRawValue() as OrderUpdate).subscribe({
      next:()=>{this.submitting.set(false);this.editing.set(false);this.load('Commande modifiée et montants recalculés.');},
      error:e=>{this.submitting.set(false);this.actionError.set(e.error?.message??'La modification a échoué.');}});}
  openCancellation(){this.actionError.set('');this.cancelForm.reset();this.cancelling.set(true);queueMicrotask(()=>this.cancelReason?.nativeElement.focus());}
  closeCancellation(){this.cancelling.set(false);}
  confirmCancellation(){if(this.cancelForm.invalid||this.submitting())return;this.submitting.set(true);this.actionError.set('');
    this.orders.cancel(this.detail()!.order.id,this.cancelForm.controls.reason.value.trim()).subscribe({
      next:()=>{this.submitting.set(false);this.cancelling.set(false);this.load('Commande annulée.');},
      error:e=>{this.submitting.set(false);this.actionError.set(e.error?.message??'L’annulation a échoué.');}});}
  submitReview(){if(this.reviewForm.invalid||this.submitting())return;this.submitting.set(true);this.actionError.set('');
    this.business.createReview(this.detail()!.order.id,this.reviewForm.getRawValue()).subscribe({
      next:()=>{this.submitting.set(false);this.load('Avis envoyé pour modération.');},
      error:e=>{this.submitting.set(false);this.actionError.set(e.error?.message??'L’envoi de l’avis a échoué.');}});}
}
