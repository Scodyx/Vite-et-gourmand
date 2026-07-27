import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Review } from '../../core/services/business.service';
import { ReviewModerationComponent } from './management';

describe('ReviewModerationComponent', () => {
  let fixture: ComponentFixture<ReviewModerationComponent>;
  let component: ReviewModerationComponent;
  let http: HttpTestingController;
  const review: Review = {
    id: 7, orderId: 9, menuTitle: 'Menu Test', customerFirstName: 'Ada', rating: 5,
    comment: 'Une prestation vraiment excellente', status: 'PENDING', createdAt: '2026-07-25T12:00:00Z'
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReviewModerationComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    fixture = TestBed.createComponent(ReviewModerationComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads pending reviews and approves one only once', () => {
    flushPending([review]); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Une prestation vraiment excellente');
    component.moderate(review, 'approve');
    expect(component.processing()).toBe(7);
    const approve = http.expectOne(request => request.url.endsWith('/employee/reviews/7/approve'));
    expect(approve.request.method).toBe('PATCH'); approve.flush({ ...review, status: 'APPROVED' });
    flushPending([]); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Avis approuvé');
  });

  it('rejects a review and handles API errors', () => {
    flushPending([review]); component.moderate(review, 'reject');
    http.expectOne(request => request.url.endsWith('/employee/reviews/7/reject'))
      .flush({ message: 'Avis déjà modéré' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Avis déjà modéré');
  });

  it('shows an explicit empty state', () => {
    flushPending([]); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aucun avis en attente');
  });

  function flushPending(reviews: Review[]): void {
    http.expectOne(request => request.url.endsWith('/employee/reviews/pending')).flush(reviews);
  }
});
