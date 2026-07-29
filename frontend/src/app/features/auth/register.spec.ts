import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { RegisterComponent } from './register';
describe('RegisterComponent',()=>{
 beforeEach(()=>TestBed.configureTestingModule({imports:[RegisterComponent],providers:[provideHttpClient(),provideRouter([])]}));
 it('rejects weak and mismatched passwords',()=>{
  const component=TestBed.createComponent(RegisterComponent).componentInstance;
  component.form.patchValue({password:'faible',confirmation:'différent'});
  expect(component.form.controls.password.invalid).toBeTrue();expect(component.form.errors?.['passwordMismatch']).toBeTrue();
 });
});
