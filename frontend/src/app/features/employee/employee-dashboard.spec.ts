import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmployeeDashboardComponent } from './employee-dashboard';

describe('EmployeeDashboardComponent', () => {
  let fixture: ComponentFixture<EmployeeDashboardComponent>;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EmployeeDashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    fixture = TestBed.createComponent(EmployeeDashboardComponent);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('derives counters from real orders and loads pending reviews', () => {
    http.expectOne(request => request.url.endsWith('/employee/orders?size=100')).flush({
      content: [item('PENDING', 9), item('IN_PREPARATION', 10)]
    });
    http.expectOne(request => request.url.endsWith('/employee/reviews/pending')).flush([{ id: 1 }, { id: 2 }]);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('1en attente'); expect(text).toContain('1à préparer'); expect(text).toContain('2avis à modérer');
    expect(fixture.nativeElement.querySelector('a[href="/employe/commandes/9"]')).not.toBeNull();
  });

  it('reports loading errors instead of inventing counters', () => {
    http.expectOne(request => request.url.endsWith('/employee/orders?size=100'))
      .flush({}, { status: 500, statusText: 'Error' });
    http.expectOne(request => request.url.endsWith('/employee/reviews/pending')).flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Impossible de charger les commandes');
  });

  function item(status: 'PENDING' | 'IN_PREPARATION', id: number) {
    return {
      order: {
        id, orderNumber: `VG-${id}`, menuId: 1, menuTitle: 'Menu', personCount: 10,
        prestationDate: '2026-08-10', desiredDeliveryTime: '12:00:00', deliveryAddress: 'Rue',
        deliveryPostalCode: '33000', deliveryCity: 'Bordeaux', deliveryCountry: 'France',
        distanceKm: 0, menuAmount: 100, discountAmount: 0, deliveryAmount: 0, totalAmount: 100,
        status, equipmentLoaned: false, cancellationReason: null, createdAt: '2026-07-25T12:00:00Z'
      },
      customer: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.test', phone: null }
    };
  }
});
