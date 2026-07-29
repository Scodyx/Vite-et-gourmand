import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmployeeOrdersComponent } from './employee-orders';

describe('EmployeeOrdersComponent',()=>{
 let fixture:ComponentFixture<EmployeeOrdersComponent>;let component:EmployeeOrdersComponent;let http:HttpTestingController;
 beforeEach(()=>{TestBed.configureTestingModule({imports:[EmployeeOrdersComponent],
  providers:[provideHttpClient(),provideHttpClientTesting(),provideRouter([])]});
  fixture=TestBed.createComponent(EmployeeOrdersComponent);component=fixture.componentInstance;http=TestBed.inject(HttpTestingController);});
 afterEach(()=>http.verify());
 it('loads the first server page and displays pagination metadata',()=>{
  flush([item()],0,20,41,3,false);fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('VG-2026-001');expect(fixture.nativeElement.textContent).toContain('41 commande');
  expect(component.totalPages()).toBe(3);expect(component.orders().length).toBe(1);
 });
 it('requests next and previous pages through query parameters',fakeAsync(()=>{
  flush([item()],0,20,41,3,false);component.goTo(1);tick();expectRequest(1).flush(page([item()],1,20,41,3,false,false));
  expect(component.page()).toBe(1);
  component.goTo(0);tick();expectRequest(0).flush(page([item()],0,20,41,3,true,false));
 }));
 it('resets page when status, dates, size or sort changes',fakeAsync(()=>{
  flush([],0,20,0,0,true);component.status='PENDING';component.dateFrom='2026-08-01';component.dateTo='2026-08-31';
  component.sort='totalAmount';component.direction='asc';component.filtersChanged();tick();
  const request=expectRequest(0);expect(request.request.params.get('status')).toBe('PENDING');
  expect(request.request.params.get('dateFrom')).toBe('2026-08-01');expect(request.request.params.get('sort')).toBe('totalAmount');request.flush(page([]));
  component.sizeChanged(50);tick();const sized=expectRequest(0);expect(sized.request.params.get('size')).toBe('50');sized.flush(page([],0,50));
 }));
 it('debounces search and performs only one server request',fakeAsync(()=>{
  flush([]);component.search='a';component.searchChanged('a');tick(100);component.search='ada';component.searchChanged('ada');tick(349);
  http.expectNone(r=>r.url.endsWith('/employee/orders'));tick(1);const request=expectRequest(0);
  expect(request.request.params.get('search')).toBe('ada');request.flush(page([]));
 }));
 it('handles empty and API error states',()=>{
  flush([]);fixture.detectChanges();expect(fixture.nativeElement.textContent).toContain('Aucune commande');
  component.load();http.expectOne(r=>r.url.endsWith('/employee/orders')).flush({}, {status:500,statusText:'Error'});
  fixture.detectChanges();expect(fixture.nativeElement.textContent).toContain('Impossible de charger');
 });
 function expectRequest(pageNumber:number){return http.expectOne(r=>r.url.endsWith('/employee/orders')&&r.params.get('page')===String(pageNumber));}
 function flush(content:ReturnType<typeof item>[],number=0,size=20,total=content.length,pages=content.length?1:0,last=true):void{
  expectRequest(number).flush(page(content,number,size,total,pages,number===0,last));}
 function page(content:ReturnType<typeof item>[],number=0,size=20,total=content.length,pages=content.length?1:0,first=true,last=true){
  return {content,page:number,size,totalElements:total,totalPages:pages,first,last};}
 function item(){return {order:{id:9,orderNumber:'VG-2026-001',menuId:1,menuTitle:'Menu Test',personCount:10,
  prestationDate:'2026-08-10',desiredDeliveryTime:'12:30:00',deliveryAddress:'1 rue Test',deliveryPostalCode:'33000',
  deliveryCity:'Bordeaux',deliveryCountry:'France',distanceKm:0,menuAmount:100,discountAmount:0,deliveryAmount:0,totalAmount:100,
  status:'PENDING' as const,equipmentLoaned:false,cancellationReason:null,createdAt:'2026-07-25T12:00:00Z'},
  customer:{firstName:'Ada',lastName:'Lovelace',email:'ada@example.test',phone:null}};}
});
