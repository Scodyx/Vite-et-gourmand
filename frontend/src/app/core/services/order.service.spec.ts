import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(OrderService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('creates an order and exposes API errors', () => {
    let status: number | undefined;
    service.create({ menuId: 1, personCount: 10 }).subscribe({ error: error => status = error.status });
    http.expectOne(r => r.url.endsWith('/orders') && r.method === 'POST')
      .flush({ message: 'Stock insuffisant' }, { status: 409, statusText: 'Conflict' });
    expect(status).toBe(409);
  });

  it('loads the current user orders', () => {
    service.mine().subscribe();
    const request = http.expectOne(r => r.url.endsWith('/orders?size=50'));
    expect(request.request.method).toBe('GET');
    request.flush({ content: [] });
  });

  it('loads and updates an owned order detail through the users/me API', () => {
    service.detail(9).subscribe();
    expect(http.expectOne(r => r.url.endsWith('/users/me/orders/9')).request.method).toBe('GET');
    service.update(9, {
      personCount: 12, prestationDate: '2026-08-10', desiredDeliveryTime: '12:30',
      deliveryAddress: '2 rue Test', deliveryPostalCode: '33000', deliveryCity: 'Bordeaux',
      deliveryCountry: 'France', distanceKm: 0
    }).subscribe();
    expect(http.expectOne(r => r.url.endsWith('/users/me/orders/9')).request.method).toBe('PUT');
  });

  it('cancels through the owned order endpoint', () => {
    service.cancel(9, 'Changement de programme').subscribe();
    const request = http.expectOne(r => r.url.endsWith('/users/me/orders/9/cancel'));
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ reason: 'Changement de programme', contactMode: 'CLIENT_EMAIL' });
    request.flush({});
  });

  it('uses employee list, detail and transition endpoints', () => {
    service.employeeOrders().subscribe();
    expect(http.expectOne(r => r.url.endsWith('/employee/orders?size=100')).request.method).toBe('GET');
    service.employeeDetail(9).subscribe();
    expect(http.expectOne(r => r.url.endsWith('/employee/orders/9')).request.method).toBe('GET');
    service.transition(9, 'ACCEPTED', 'Commande validée').subscribe();
    const transition = http.expectOne(r => r.url.endsWith('/employee/orders/9/status'));
    expect(transition.request.method).toBe('PATCH');
    expect(transition.request.body).toEqual({ status: 'ACCEPTED', comment: 'Commande validée' });
  });
});
