import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideRouter } from '@angular/router';
import { OrderStatus } from '../../core/models/order';
import { OrderDetailComponent } from './order-detail';

describe('OrderDetailComponent', () => {
  let fixture: ComponentFixture<OrderDetailComponent>;
  let component: OrderDetailComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OrderDetailComponent],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '9' }) } } }
      ]
    });
    fixture = TestBed.createComponent(OrderDetailComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads and displays the number, server total, translated status and history', () => {
    flushDetail('PENDING');
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('VG-2026-TEST');
    expect(fixture.nativeElement.querySelector('.total dd').textContent).toContain('108');
    expect(text).toContain('En attente');
    expect(text).toContain('Commande créée');
    expect(text).toContain('Client');
  });

  it('shows edit and cancellation actions only while pending', () => {
    flushDetail('PENDING');
    expect(button('Modifier')).not.toBeNull();
    expect(button('Annuler')).not.toBeNull();
    component.detail.set(detail('ACCEPTED'));
    fixture.detectChanges();
    expect(button('Modifier')).toBeNull();
    expect(button('Annuler')).toBeNull();
  });

  it('submits an update and reloads server-calculated amounts', () => {
    flushDetail('PENDING');
    button('Modifier')!.click(); fixture.detectChanges();
    component.editForm.patchValue({ personCount: 12, deliveryAddress: '2 rue Test' });
    component.saveEdit();
    const update = http.expectOne(request => request.url.endsWith('/users/me/orders/9') && request.method === 'PUT');
    expect(update.request.body.personCount).toBe(12);
    expect(update.request.body).not.toEqual(jasmine.objectContaining({ totalAmount: jasmine.anything() }));
    update.flush(detail('PENDING').order);
    http.expectOne(request => request.url.endsWith('/users/me/orders/9') && request.method === 'GET')
      .flush(detail('PENDING', false, 120));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Commande modifiée');
  });

  it('displays a stock error returned by the API', () => {
    flushDetail('PENDING');
    button('Modifier')!.click(); fixture.detectChanges(); component.saveEdit();
    http.expectOne(request => request.method === 'PUT').flush(
      { message: 'Stock insuffisant pour cette modification' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Stock insuffisant');
  });

  it('requires confirmation, cancels without window.prompt and reloads the order', () => {
    spyOn(window, 'prompt');
    flushDetail('PENDING');
    button('Annuler')!.click(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Confirmer l’annulation');
    component.cancelForm.setValue({ reason: 'Changement de programme' });
    component.confirmCancellation();
    const cancellation = http.expectOne(request => request.method === 'PATCH' && request.url.endsWith('/cancel'));
    expect(cancellation.request.body.reason).toBe('Changement de programme');
    cancellation.flush(detail('CANCELLED').order);
    http.expectOne(request => request.method === 'GET').flush(detail('CANCELLED'));
    expect(window.prompt).not.toHaveBeenCalled();
  });

  it('shows a valid review form only for a completed order and reloads after success', () => {
    flushDetail('COMPLETED');
    expect(fixture.nativeElement.textContent).toContain('Laisser un avis');
    component.reviewForm.setValue({ rating: 0, comment: 'Commentaire suffisamment long' });
    expect(component.reviewForm.invalid).toBeTrue();
    component.reviewForm.setValue({ rating: 5, comment: 'Une prestation vraiment excellente' });
    component.submitReview();
    const review = http.expectOne(request => request.method === 'POST' && request.url.endsWith('/orders/9/review'));
    expect(review.request.body).toEqual({ rating: 5, comment: 'Une prestation vraiment excellente' });
    review.flush({ id: 2 });
    http.expectOne(request => request.method === 'GET').flush(detail('COMPLETED', true));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Avis envoyé');
    expect(fixture.nativeElement.textContent).toContain('déjà été envoyé');
  });

  it('hides the review form when an opinion was already submitted', () => {
    flushDetail('COMPLETED', true);
    expect(fixture.nativeElement.textContent).not.toContain('Laisser un avis');
    expect(fixture.nativeElement.textContent).toContain('déjà été envoyé');
  });

  it('displays an API error when the review already exists', () => {
    flushDetail('COMPLETED');
    component.reviewForm.setValue({ rating: 4, comment: 'Une prestation très satisfaisante' });
    component.submitReview();
    http.expectOne(request => request.method === 'POST').flush(
      { message: 'Un avis existe déjà pour cette commande' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Un avis existe déjà');
  });

  it('renders a not-found state from the API', () => {
    http.expectOne(request => request.url.endsWith('/users/me/orders/9'))
      .flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Commande introuvable');
  });

  function flushDetail(status: OrderStatus, reviewSubmitted = false) {
    http.expectOne(request => request.url.endsWith('/users/me/orders/9')).flush(detail(status, reviewSubmitted));
    fixture.detectChanges();
  }
  function button(label: string): HTMLButtonElement | null {
    return [...fixture.nativeElement.querySelectorAll('button')]
      .find((element: HTMLButtonElement) => element.textContent?.trim() === label) ?? null;
  }
  function detail(status: OrderStatus, reviewSubmitted = false, totalAmount = 108) {
    return {
      order: {
        id: 9, orderNumber: 'VG-2026-TEST', menuId: 1, menuTitle: 'Menu Test', personCount: 10,
        prestationDate: '2026-08-10', desiredDeliveryTime: '12:30:00', deliveryAddress: '1 rue Test',
        deliveryPostalCode: '33000', deliveryCity: 'Bordeaux', deliveryCountry: 'France', distanceKm: 0,
        menuAmount: 100, discountAmount: 2, deliveryAmount: 10, totalAmount, status,
        equipmentLoaned: false, cancellationReason: status === 'CANCELLED' ? 'Changement de programme' : null,
        createdAt: '2026-07-25T12:00:00Z'
      },
      history: [{
        previousStatus: null, newStatus: 'PENDING' as OrderStatus, changedAt: '2026-07-25T12:00:00Z',
        actor: 'Client', comment: 'Commande créée'
      }],
      reviewSubmitted
    };
  }
});
