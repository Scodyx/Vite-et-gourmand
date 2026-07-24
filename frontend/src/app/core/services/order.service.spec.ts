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
});
