import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MenuService } from './menu.service';

describe('MenuService', () => {
  let service: MenuService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(MenuService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads the public catalogue with filters', () => {
    service.list({ theme: 'Nature', page: 1 }).subscribe();
    const request = http.expectOne(r => r.url.endsWith('/public/menus'));
    expect(request.request.params.get('theme')).toBe('Nature');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('12');
    request.flush({ content: [] });
  });

  it('loads a menu by slug', () => {
    service.detail('menu-test').subscribe();
    const request = http.expectOne(r => r.url.endsWith('/public/menus/menu-test'));
    expect(request.request.method).toBe('GET');
    request.flush({});
  });
});
