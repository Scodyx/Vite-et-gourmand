import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmployeeOrdersComponent } from './employee-orders';

describe('EmployeeOrdersComponent', () => {
  let fixture: ComponentFixture<EmployeeOrdersComponent>;
  let component: EmployeeOrdersComponent;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EmployeeOrdersComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    fixture = TestBed.createComponent(EmployeeOrdersComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads real employee orders and links to their detail', () => {
    flush([item('PENDING')]); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('VG-2026-001');
    expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');
    expect(fixture.nativeElement.querySelector('a[href="/employe/commandes/9"]')).not.toBeNull();
  });

  it('filters by status and resets all filters', () => {
    flush([item('PENDING'), item('COMPLETED', 10)]); fixture.detectChanges();
    component.status = 'COMPLETED'; fixture.detectChanges();
    expect(component.filtered().map(value => value.order.id)).toEqual([10]);
    component.search = 'introuvable'; component.dateFrom = '2030-01-01'; component.dateScope = 'TODAY';
    component.resetFilters(); fixture.detectChanges();
    expect(component.filtered().length).toBe(2);
    expect(component.status).toBe(''); expect(component.search).toBe(''); expect(component.dateScope).toBe('ALL');
  });

  it('shows empty and API error states', () => {
    flush([]); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aucune commande ne correspond');
    component.load();
    http.expectOne(request => request.url.endsWith('/employee/orders?size=100'))
      .flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Impossible de charger');
  });

  function flush(content: ReturnType<typeof item>[]): void {
    http.expectOne(request => request.url.endsWith('/employee/orders?size=100')).flush({ content });
  }
  function item(status: 'PENDING' | 'COMPLETED', id = 9) {
    return {
      order: {
        id, orderNumber: id === 9 ? 'VG-2026-001' : 'VG-2026-002', menuId: 1, menuTitle: 'Menu Test',
        personCount: 10, prestationDate: '2026-08-10', desiredDeliveryTime: '12:30:00',
        deliveryAddress: '1 rue Test', deliveryPostalCode: '33000', deliveryCity: 'Bordeaux',
        deliveryCountry: 'France', distanceKm: 0, menuAmount: 100, discountAmount: 0,
        deliveryAmount: 0, totalAmount: 100, status, equipmentLoaned: false,
        cancellationReason: null, createdAt: '2026-07-25T12:00:00Z'
      },
      customer: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.test', phone: null }
    };
  }
});
