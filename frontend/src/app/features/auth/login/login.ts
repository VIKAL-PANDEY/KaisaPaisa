import { Component } from '@angular/core';
import { AuthFormComponent } from '../auth-form/auth-form';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [AuthFormComponent],
  template: `<app-auth-form></app-auth-form>`
})
export class LoginComponent {}
