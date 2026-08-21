import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card kp-card">
        <div class="auth-header">
          <div class="logo-box">KP</div>
          <h2>Create Your Account</h2>
          <p class="auth-subtitle">Join KaisaPaisa — Know your money.</p>
        </div>

        @if (errorMessage()) {
          <div class="alert-error">{{ errorMessage() }}</div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input
              type="text"
              [(ngModel)]="name"
              name="name"
              class="form-control"
              placeholder="e.g. Vikal Pandey"
              required
              autocomplete="name"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Email address</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              class="form-control"
              placeholder="vpand301@gmail.com"
              required
              autocomplete="email"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              class="form-control"
              placeholder="At least 6 characters"
              required
              autocomplete="new-password"
            >
          </div>

          <button type="submit" [disabled]="loading()" class="btn btn-primary btn-full">
            {{ loading() ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <div class="auth-footer">
          Already have an account? <a routerLink="/login" class="auth-link">Sign in</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #F5F5F2 0%, #EAF0EB 100%);
      padding: 20px;
    }

    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 40px 36px;
      animation: fadeUp 300ms ease-out;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .auth-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .logo-box {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #202522 0%, #3a4a3e 100%);
      color: #fff;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 18px;
      margin: 0 auto 16px auto;
      box-shadow: 0 4px 16px rgba(32,37,34,0.18);
    }

    .auth-header h2 {
      font-size: 22px;
      font-weight: 700;
    }

    .auth-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
      margin-top: 6px;
    }

    .btn-full {
      width: 100%;
      padding: 12px;
      margin-top: 8px;
      font-size: 15px;
      font-weight: 600;
    }

    .btn-full:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }

    .auth-footer {
      text-align: center;
      font-size: 13px;
      color: var(--text-secondary);
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
    }

    .auth-link {
      color: var(--text-primary);
      font-weight: 600;
      text-decoration: none;
    }

    .auth-link:hover { text-decoration: underline; }

    .alert-error {
      background-color: var(--bg-expense-light);
      color: var(--color-expense);
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 20px;
      border: 1px solid #FFCDD2;
    }
  `]
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  loading = signal(false);
  errorMessage = signal('');

  onSubmit() {
    if (!this.name || !this.email || !this.password) {
      this.errorMessage.set('Please fill out all fields.');
      return;
    }
    if (this.password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.register({ name: this.name, email: this.email, password: this.password })
      .pipe(catchError(err => {
        this.loading.set(false);
        if (err.status === 0) {
          this.errorMessage.set('Unable to connect to server. Please check your backend API is running.');
        } else {
          this.errorMessage.set(err.error?.message || err.message || 'Registration failed.');
        }
        return of(null);
      }))
      .subscribe(res => {
        this.loading.set(false);
        if (res?.success) {
          this.router.navigate(['/dashboard']);
        }
      });
  }
}
