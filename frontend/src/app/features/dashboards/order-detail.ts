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
  template: `
  <main class="container section order-detail" aria-labelledby="order-title">
    <a routerLink="/espace" class="back-link">← Retour à mes commandes</a>
    @if (loading()) {
      <p role="status" aria-live="polite">Chargement de la commande…</p>
    } @else if (error()) {
      <section class="alert error" role="alert"><h1 id="order-title">{{errorTitle()}}</h1><p>{{error()}}</p></section>
    } @else if (detail(); as data) {
      <header class="order-heading">
        <div><p class="eyebrow">Commande</p><h1 id="order-title">{{data.order.orderNumber}}</h1></div>
        <span class="tag">{{statusLabel(data.order.status)}}</span>
      </header>
      @if (success()) {<p class="alert" role="status" aria-live="polite">{{success()}}</p>}
      @if (actionError()) {<p class="alert error" role="alert">{{actionError()}}</p>}

      <div class="order-layout">
        <section class="card" aria-labelledby="summary-title"><h2 id="summary-title">Prestation</h2>
          <dl>
            <div><dt>Menu</dt><dd>{{data.order.menuTitle}}</dd></div>
            <div><dt>Créée le</dt><dd>{{data.order.createdAt|date:'dd/MM/yyyy à HH:mm'}}</dd></div>
            <div><dt>Date</dt><dd>{{data.order.prestationDate|date:'dd/MM/yyyy'}}</dd></div>
            <div><dt>Heure souhaitée</dt><dd>{{data.order.desiredDeliveryTime}}</dd></div>
            <div><dt>Nombre de personnes</dt><dd>{{data.order.personCount}}</dd></div>
            <div><dt>Adresse</dt><dd>{{data.order.deliveryAddress}}, {{data.order.deliveryPostalCode}} {{data.order.deliveryCity}}, {{data.order.deliveryCountry}}</dd></div>
            <div><dt>Matériel prêté</dt><dd>{{data.order.equipmentLoaned?'Oui':'Non'}}</dd></div>
          </dl>
          @if(data.order.cancellationReason){<p class="conditions"><strong>Motif d’annulation :</strong> {{data.order.cancellationReason}}</p>}
        </section>
        <section class="card" aria-labelledby="amount-title"><h2 id="amount-title">Montants calculés</h2>
          <dl>
            <div><dt>Menu</dt><dd>{{data.order.menuAmount|currency:'EUR'}}</dd></div>
            <div><dt>Remise</dt><dd>− {{data.order.discountAmount|currency:'EUR'}}</dd></div>
            <div><dt>Livraison</dt><dd>{{data.order.deliveryAmount|currency:'EUR'}}</dd></div>
            <div class="total"><dt>Total</dt><dd>{{data.order.totalAmount|currency:'EUR'}}</dd></div>
          </dl>
          @if(data.order.status==='PENDING'){
            <div class="actions">
              <button type="button" class="button" (click)="openEdit()">Modifier</button>
              <button type="button" class="button secondary" (click)="openCancellation()">Annuler</button>
            </div>
          }
        </section>
      </div>

      @if(editing()){
        <section class="form-card wide order-form" aria-labelledby="edit-title">
          <h2 id="edit-title">Modifier la commande</h2><p class="muted">Le menu reste inchangé. Les montants seront recalculés par le serveur.</p>
          <form [formGroup]="editForm" (ngSubmit)="saveEdit()">
            <div class="two">
              <label>Nombre de personnes<input type="number" min="1" formControlName="personCount"></label>
              <label>Date de prestation<input type="date" formControlName="prestationDate"></label>
              <label>Heure souhaitée<input type="time" formControlName="desiredDeliveryTime"></label>
              <label>Adresse<input formControlName="deliveryAddress"></label>
              <label>Code postal<input formControlName="deliveryPostalCode"></label>
              <label>Ville<input formControlName="deliveryCity"></label>
              <label>Pays<input formControlName="deliveryCountry"></label>
              <label>Distance (km)<input type="number" min="0" step=".1" formControlName="distanceKm"></label>
            </div>
            <div class="actions"><button class="button" [disabled]="editForm.invalid||submitting()">Enregistrer</button>
            <button type="button" class="button secondary" (click)="editing.set(false)" [disabled]="submitting()">Fermer</button></div>
          </form>
        </section>
      }

      @if(cancelling()){
        <section class="form-card order-form" aria-labelledby="cancel-title" (keydown.escape)="closeCancellation()">
          <h2 id="cancel-title">Confirmer l’annulation</h2><p>Cette action restituera le stock réservé.</p>
          <form [formGroup]="cancelForm" (ngSubmit)="confirmCancellation()">
            <label>Motif de l’annulation<textarea #cancelReason rows="4" formControlName="reason"></textarea></label>
            <div class="actions"><button class="button" [disabled]="cancelForm.invalid||submitting()">Confirmer</button>
            <button type="button" class="button secondary" (click)="closeCancellation()" [disabled]="submitting()">Retour</button></div>
          </form>
        </section>
      }

      <section class="card history" aria-labelledby="history-title"><h2 id="history-title">Historique des statuts</h2>
        <ol>@for(entry of data.history;track entry.changedAt){
          <li><strong>{{statusLabel(entry.previousStatus)}} → {{statusLabel(entry.newStatus)}}</strong>
          <time [attr.datetime]="entry.changedAt">{{entry.changedAt|date:'dd/MM/yyyy à HH:mm'}}</time>
          @if(entry.actor){<span>{{entry.actor}}</span>} @if(entry.comment){<p>{{entry.comment}}</p>}</li>
        } @empty {<li>Aucun historique disponible.</li>}</ol>
      </section>

      @if(data.order.status==='COMPLETED'&&!data.reviewSubmitted){
        <section class="form-card order-form" aria-labelledby="review-title"><h2 id="review-title">Laisser un avis</h2>
          <form [formGroup]="reviewForm" (ngSubmit)="submitReview()">
            <label>Note sur 5<input type="number" min="1" max="5" formControlName="rating"></label>
            <label>Commentaire<textarea rows="6" maxlength="2000" formControlName="comment"></textarea></label>
            <p class="muted">{{reviewForm.controls.comment.value.length}} / 2000 caractères</p>
            <button class="button" [disabled]="reviewForm.invalid||submitting()">Envoyer l’avis</button>
          </form>
        </section>
      } @else if(data.order.status==='COMPLETED'&&data.reviewSubmitted) {
        <p class="alert" role="status">Votre avis a déjà été envoyé et attend éventuellement sa modération.</p>
      }
    }
  </main>`
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
