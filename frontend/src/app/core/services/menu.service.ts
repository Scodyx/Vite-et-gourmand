import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Menu, Page } from '../models/menu';
@Injectable({ providedIn: 'root' })
export class MenuService {
  constructor(private http: HttpClient) {}
  list() { return this.http.get<Page<Menu>>(`${environment.apiUrl}/public/menus?size=50&sort=title`); }
  detail(slug: string) { return this.http.get<Menu>(`${environment.apiUrl}/public/menus/${slug}`); }
}
