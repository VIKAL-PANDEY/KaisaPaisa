import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card kp-card">
        <div class="auth-header">
          <div class="logo-box">KP</div>
          <h2>Sign in to KaisaPaisa</h2>
          <p class="auth-subtitle">Know your money. Control your spending.</p>
        </div>

        @if (errorMessage()) {
          <div class="alert-error">{{ errorMessage() }}</div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">Email address</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              class="form-control"
              placeholder="student@kaisapaisa.com"
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
              placeholder="••••••••"
              required
              autocomplete="current-password"
            >
          </div>

          <button type="submit" [disabled]="loading()" class="btn btn-primary btn-full">
            {{ loading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="demo-hint">
          <strong>Demo:</strong> student&#64;kaisapaisa.com / Password123
        </div>

        <div class="auth-footer">
          Don't have an account? <a routerLink="/register" class="auth-link">Create an account</a>
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
      letter-spacing: -1px;
    }

    .auth-header h2 {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
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

    .demo-hint {
      margin-top: 16px;
      background: #EDE7F6;
      color: #512DA8;
      font-size: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      text-align: center;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  errorMessage = signal('');

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage.set('Please enter both email and password.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login({ email: this.email, password: this.password })
      .pipe(catchError(err => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid email or password.');
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
