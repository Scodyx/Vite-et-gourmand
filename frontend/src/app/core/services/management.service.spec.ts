import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ManagementService, OpeningHours } from './management.service';
import { environment } from '../../../environments/environment';

describe('ManagementService admin API', () => {
  let service: ManagementService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});
    service=TestBed.inject(ManagementService);http=TestBed.inject(HttpTestingController);
  });
  afterEach(()=>http.verify());

  it('uses the protected employee endpoints',()=>{
    service.employees().subscribe();http.expectOne(`${environment.apiUrl}/admin/employees`).flush([]);
    service.enableEmployee(7,false).subscribe();
    expect(http.expectOne(r=>r.url.endsWith('/admin/employees/7/enabled')&&r.params.get('value')==='false').request.method).toBe('PATCH');
  });
  it('creates an employee without a role field added by the service',()=>{
    const value={firstName:'A',lastName:'B',email:'a@example.test',temporaryPassword:'Strong-Password1!'};
    service.createEmployee(value).subscribe();
    const request=http.expectOne(`${environment.apiUrl}/admin/employees`);
    expect(request.request.method).toBe('POST');expect(request.request.body).toEqual(value);request.flush({});
  });
  it('uses ADMIN-only opening-hours endpoints',()=>{
    service.openingHours().subscribe();http.expectOne(`${environment.apiUrl}/admin/opening-hours`).flush([]);
    const value={id:1,dayOfWeek:'MONDAY',openingTime:'09:00',closingTime:'18:00',closed:false,displayOrder:1} as OpeningHours;
    service.updateOpeningHours(value).subscribe();
    expect(http.expectOne(`${environment.apiUrl}/admin/opening-hours/1`).request.method).toBe('PUT');
  });
  it('loads and rebuilds real statistics',()=>{
    service.revenue().subscribe();http.expectOne(`${environment.apiUrl}/admin/statistics/revenue`).flush({});
    service.rebuildStatistics().subscribe();expect(http.expectOne(`${environment.apiUrl}/admin/statistics/rebuild`).request.method).toBe('POST');
  });
});
