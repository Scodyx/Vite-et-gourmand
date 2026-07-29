import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { OrderStatus } from '../../core/models/order';
import { EmployeeOrderDetailComponent } from './employee-order-detail';

describe('EmployeeOrderDetailComponent', () => {
  let fixture: ComponentFixture<EmployeeOrderDetailComponent>;
  let component: EmployeeOrderDetailComponent;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EmployeeOrderDetailComponent],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '9' }) } } }
      ]
    });
    fixture = TestBed.createComponent(EmployeeOrderDetailComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('displays customer, amounts, translated status and chronological history', () => {
    flushDetail('PENDING'); fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('VG-2026-001'); expect(text).toContain('Ada Lovelace');
    expect(text).toContain('En attente'); expect(text).toContain('Commande créée');
    expect(fixture.nativeElement.querySelector('ol.timeline')).not.toBeNull();
  });

  it('offers only valid transitions and no action for a final order', () => {
    flushDetail('DELIVERED', true); fixture.detectChanges();
    expect(button('En attente du retour de matériel')).not.toBeNull();
    expect(button('Terminée')).toBeNull();
    component.detail.set(detail('COMPLETED')); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Changer le statut');
  });

  it('confirms a transition without window.prompt, sends its comment and reloads history', () => {
    spyOn(window, 'prompt');
    flushDetail('PENDING'); fixture.detectChanges();
    button('Acceptée')!.click(); fixture.detectChanges();
    component.comment = 'Commande vérifiée';
    component.confirmTransition();
    const request = http.expectOne(value => value.url.endsWith('/employee/orders/9/status'));
    expect(request.request.body).toEqual({ status: 'ACCEPTED', comment: 'Commande vérifiée' });
    request.flush({});
    http.expectOne(value => value.url.endsWith('/employee/orders/9')).flush(detail('ACCEPTED'));
    expect(window.prompt).not.toHaveBeenCalled();
  });

  it('keeps the confirmation open and displays a business rejection', () => {
    flushDetail('PENDING'); fixture.detectChanges();
    button('Acceptée')!.click(); fixture.detectChanges(); component.confirmTransition();
    http.expectOne(value => value.url.endsWith('/status')).flush(
      { message: 'Transition de statut interdite' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Transition de statut interdite');
    expect(component.confirming()).toBe('ACCEPTED');
  });

  function flushDetail(status: OrderStatus, equipmentLoaned = false): void {
    http.expectOne(value => value.url.endsWith('/employee/orders/9')).flush(detail(status, equipmentLoaned));
  }
  function button(label: string): HTMLButtonElement | null {
    return [...fixture.nativeElement.querySelectorAll('button')]
      .find((element: HTMLButtonElement) => element.textContent?.trim() === label) ?? null;
  }
  function detail(status: OrderStatus, equipmentLoaned = false) {
    return {
      summary: {
        order: {
          id: 9, orderNumber: 'VG-2026-001', menuId: 1, menuTitle: 'Menu Test', personCount: 10,
          prestationDate: '2026-08-10', desiredDeliveryTime: '12:30:00', deliveryAddress: '1 rue Test',
          deliveryPostalCode: '33000', deliveryCity: 'Bordeaux', deliveryCountry: 'France', distanceKm: 0,
          menuAmount: 100, discountAmount: 10, deliveryAmount: 0, totalAmount: 90, status,
          equipmentLoaned, cancellationReason: null, createdAt: '2026-07-25T12:00:00Z'
        },
        customer: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.test', phone: '0600000000' }
      },
      history: [{
        previousStatus: null, newStatus: 'PENDING' as OrderStatus, changedAt: '2026-07-25T12:00:00Z',
        actor: 'Client', comment: 'Commande créée'
      }]
    };
  }
});
