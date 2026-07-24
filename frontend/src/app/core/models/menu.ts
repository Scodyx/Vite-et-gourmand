export interface Menu {
  id: number; title: string; slug: string; description: string; theme: string; diet: string;
  minimumPersons: number; basePrice: number; availableStock: number;
}
export interface Page<T> { content: T[]; totalElements: number; totalPages: number; number: number; }
export interface MenuDetail extends Menu {
  conditions:string;
  images:{id:number;url:string;altText:string;displayOrder:number}[];
  dishes:{id:number;name:string;description:string;type:'ENTRY'|'MAIN_COURSE'|'DESSERT';allergens:string[]}[];
}
