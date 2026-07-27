import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Menu, MenuDetail, Page } from '../models/menu';
@Injectable({ providedIn: 'root' })
export class MenuService {
  constructor(private http: HttpClient) {}
  list(filters:Record<string,string|number|undefined>={}) {
    const params=Object.fromEntries(Object.entries({size:12,sort:'title',...filters}).filter(([,v])=>v!==undefined&&v!==''));
    return this.http.get<Page<Menu>>(`${environment.apiUrl}/public/menus`,{params});
  }
  detail(slug: string) { return this.http.get<MenuDetail>(`${environment.apiUrl}/public/menus/${slug}`); }
}
