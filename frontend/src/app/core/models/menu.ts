export interface Menu {
  id: number; title: string; slug: string; description: string; theme: string; diet: string;
  minimumPersons: number; basePrice: number; availableStock: number;
}
export interface Page<T> { content: T[]; totalElements: number; totalPages: number; number: number; }
