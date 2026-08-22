import { Component, inject, signal, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
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
          <div class="auth-logo-wrapper">
            <img src="/kaisapaisa-logo.png" alt="KaisaPaisa" class="auth-logo-img">
          </div>
          <h2>Sign in to KaisaPaisa</h2>
          <p class="auth-subtitle">Know your money. Control your spending.</p>
        </div>

        @if (errorMessage()) {
          <div class="alert-error">{{ errorMessage() }}</div>
        }

        <!-- Google OAuth Sign-In Action -->
        <div class="google-auth-section">
          <button
            type="button"
            (click)="handleGoogleClick()"
            [disabled]="googleLoading()"
            class="btn-google"
            id="google-signin-btn"
          >
            @if (googleLoading()) {
              <div class="spinner-sm"></div>
              <span>Connecting to Google...</span>
            } @else {
              <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            }
          </button>
        </div>

        <div class="auth-divider">
          <span>or sign in with email</span>
        </div>

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">Email address</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              class="form-control"
              placeholder="name@example.com"
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

        <div class="auth-footer">
          Don't have an account? <a routerLink="/register" class="auth-link">Create an account</a>
        </div>
      </div>

      <!-- Google Account Selector Modal (for dev/preview and direct Google Auth) -->
      @if (showGoogleModal()) {
        <div class="modal-backdrop" (click)="closeGoogleModal()">
          <div class="google-modal-card" (click)="$event.stopPropagation()">
            <div class="gm-header">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <h3>Sign in with Google</h3>
              <p>Choose an account to continue to KaisaPaisa</p>
            </div>

            <div class="gm-accounts">
              <!-- Quick One-Click Google Profiles -->
              <button type="button" class="account-item" (click)="selectGoogleAccount('Vikal Pandey', 'vpand301@gmail.com')">
                <div class="acc-avatar" style="background-color: #E8F0FE; color: #1A73E8;">V</div>
                <div class="acc-text">
                  <div class="acc-name">Vikal Pandey</div>
                  <div class="acc-email">vpand301&#64;gmail.com</div>
                </div>
              </button>

              <button type="button" class="account-item" (click)="selectGoogleAccount('College Student', 'student.finance@gmail.com')">
                <div class="acc-avatar" style="background-color: #E6F4EA; color: #137333;">S</div>
                <div class="acc-text">
                  <div class="acc-name">Student Account</div>
                  <div class="acc-email">student.finance&#64;gmail.com</div>
                </div>
              </button>
            </div>

            <div class="custom-google-form">
              <div class="custom-title">Or use another Google account:</div>
              <div class="form-group" style="margin-bottom: 8px;">
                <input
                  type="text"
                  [(ngModel)]="customGoogleName"
                  placeholder="Your Name (e.g. Alex Sharma)"
                  class="form-control"
                />
              </div>
              <div class="form-group" style="margin-bottom: 12px;">
                <input
                  type="email"
                  [(ngModel)]="customGoogleEmail"
                  placeholder="name@gmail.com"
                  class="form-control"
                />
              </div>
              <button
                type="button"
                (click)="submitCustomGoogleLogin()"
                [disabled]="!customGoogleEmail || googleLoading()"
                class="btn btn-primary btn-full"
              >
                {{ googleLoading() ? 'Signing in...' : 'Continue as Google User' }}
              </button>
            </div>

            <button type="button" class="btn-cancel" (click)="closeGoogleModal()">Cancel</button>
          </div>
        </div>
      }
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
      padding: 36px 32px;
      animation: fadeUp 300ms ease-out;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .auth-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .auth-logo-wrapper {
      display: flex;
      justify-content: center;
      margin-bottom: 12px;
    }

    .auth-logo-img {
      width: 72px;
      height: 72px;
      object-fit: contain;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      background: #FFFFFF;
      padding: 4px;
    }

    .auth-header h2 {
      font-size: 21px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .auth-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .google-auth-section {
      margin-bottom: 18px;
      display: flex;
      justify-content: center;
    }

    .google-native-btn-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
      min-height: 44px;
    }

    .btn-google {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 10px 16px;
      background: #FFFFFF;
      color: #3C4043;
      border: 1px solid #DADCE0;
      border-radius: var(--radius-btn);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(60,64,67,0.08);
      transition: all 0.2s ease;
    }

    .btn-google:hover:not(:disabled) {
      background: #F8F9FA;
      border-color: #D2E3FC;
      box-shadow: 0 2px 6px rgba(60,64,67,0.15);
      color: #202124;
    }

    .btn-google:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .google-icon {
      flex-shrink: 0;
    }

    .auth-divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 18px 0;
      color: var(--text-muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .auth-divider::before,
    .auth-divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid var(--border-color);
    }

    .auth-divider span {
      padding: 0 10px;
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
      margin-top: 22px;
      padding-top: 18px;
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
      margin-bottom: 16px;
      border: 1px solid #FFCDD2;
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid #DADCE0;
      border-top-color: #4285F4;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .hidden {
      display: none !important;
    }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(32, 37, 34, 0.45);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 20px;
    }

    .google-modal-card {
      background: #FFFFFF;
      width: 100%;
      max-width: 380px;
      border-radius: 16px;
      padding: 28px 24px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.18);
      animation: popIn 250ms ease-out;
    }

    @keyframes popIn {
      from { opacity: 0; transform: scale(0.95); }
      to   { opacity: 1; transform: scale(1); }
    }

    .gm-header {
      text-align: center;
      margin-bottom: 20px;
    }

    .gm-header h3 {
      font-size: 18px;
      font-weight: 700;
      margin-top: 8px;
      color: #202124;
    }

    .gm-header p {
      font-size: 12.5px;
      color: #5F6368;
      margin-top: 4px;
    }

    .gm-accounts {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .account-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #E0E0E0;
      background: #FFFFFF;
      border-radius: 10px;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
    }

    .account-item:hover {
      background-color: #F8F9FA;
      border-color: #4285F4;
    }

    .acc-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }

    .acc-name {
      font-size: 13.5px;
      font-weight: 600;
      color: #202124;
    }

    .acc-email {
      font-size: 11.5px;
      color: #5F6368;
    }

    .custom-google-form {
      background: #F8F9FA;
      border-radius: 10px;
      padding: 14px;
      margin-top: 8px;
      border: 1px dashed #DADCE0;
    }

    .custom-title {
      font-size: 12px;
      font-weight: 600;
      color: #5F6368;
      margin-bottom: 8px;
    }

    .btn-cancel {
      width: 100%;
      background: none;
      border: none;
      font-size: 13px;
      color: #5F6368;
      font-weight: 500;
      cursor: pointer;
      margin-top: 14px;
      padding: 6px;
    }

    .btn-cancel:hover {
      color: #202124;
    }
  `]
})
export class LoginComponent implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  @ViewChild('googleBtnContainer') googleBtnContainer?: ElementRef;

  email = '';
  password = '';
  loading = signal(false);
  googleLoading = signal(false);
  errorMessage = signal('');

  hasGoogleClientId = signal(false);
  googleClientId = signal('');
  showGoogleModal = signal(false);

  customGoogleName = '';
  customGoogleEmail = 'vpand301@gmail.com';

  ngOnInit() {
    this.authService.getGoogleConfig()
      .pipe(catchError(() => of({ clientId: '' })))
      .subscribe(res => {
        if (res?.clientId) {
          this.googleClientId.set(res.clientId);
          this.hasGoogleClientId.set(true);
          this.initializeGoogleIdentity(res.clientId);
        }
      });
  }

  ngAfterViewInit() {
    if (this.googleClientId()) {
      this.initializeGoogleIdentity(this.googleClientId());
    }
  }

  initializeGoogleIdentity(clientId: string) {
    const google = (window as any).google;
    if (google?.accounts?.id) {
      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => this.handleGoogleCredentialResponse(response),
          auto_select: false
        });

        const btnElement = document.getElementById('googleBtnContainer');
        if (btnElement) {
          google.accounts.id.renderButton(btnElement, {
            theme: 'outline',
            size: 'large',
            width: 350,
            text: 'continue_with',
            shape: 'rectangular'
          });
        }
      } catch (e) {
        console.warn('[Google Auth Init Warning]:', e);
      }
    }
  }

  handleGoogleClick() {
    const clientId = this.googleClientId() || '336826701835-93v5eq269ho5hisjrra0ofogtm1394t8.apps.googleusercontent.com';
    const google = (window as any).google;

    if (google?.accounts?.oauth2) {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              console.warn('Google Token Client response error:', tokenResponse.error);
              this.googleLoading.set(false);
              this.showGoogleModal.set(true);
              return;
            }

            if (tokenResponse?.access_token) {
              this.googleLoading.set(true);
              this.errorMessage.set('');
              try {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                if (userRes.ok) {
                  const userInfo = await userRes.json();
                  this.authService.googleLogin({
                    profile: {
                      name: userInfo.name,
                      email: userInfo.email,
                      googleId: userInfo.sub,
                      picture: userInfo.picture
                    }
                  }).subscribe({
                    next: (res) => {
                      this.googleLoading.set(false);
                      if (res?.success) this.router.navigate(['/dashboard']);
                    },
                    error: (err) => {
                      this.googleLoading.set(false);
                      this.errorMessage.set(err.error?.message || err.error?.error || 'Google sign in failed');
                    }
                  });
                  return;
                }
              } catch (e) {
                console.warn('Failed fetching Google userinfo:', e);
              }
              this.googleLoading.set(false);
              this.showGoogleModal.set(true);
            }
          },
          error_callback: (err: any) => {
            console.warn('Google Token Client error_callback:', err);
            this.googleLoading.set(false);
            this.showGoogleModal.set(true);
          }
        });
        client.requestAccessToken();
        return;
      } catch (err) {
        console.warn('Google OAuth token client error, showing selector:', err);
      }
    }

    if (google?.accounts?.id) {
      try {
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            this.showGoogleModal.set(true);
          }
        });
        return;
      } catch {
        this.showGoogleModal.set(true);
      }
    } else {
      // Show Google Account Selector Modal
      this.showGoogleModal.set(true);
    }
  }

  closeGoogleModal() {
    this.showGoogleModal.set(false);
  }

  selectGoogleAccount(name: string, email: string) {
    this.googleLoading.set(true);
    this.errorMessage.set('');
    this.showGoogleModal.set(false);

    this.authService.googleLogin({
      profile: {
        name,
        email,
        googleId: `g_${email.replace(/[^a-zA-Z0-9]/g, '_')}`
      }
    })
    .pipe(catchError(err => {
      this.googleLoading.set(false);
      this.errorMessage.set(err.error?.message || 'Google authentication failed.');
      return of(null);
    }))
    .subscribe(res => {
      this.googleLoading.set(false);
      if (res?.success) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  submitCustomGoogleLogin() {
    if (!this.customGoogleEmail) return;
    this.selectGoogleAccount(this.customGoogleName || this.customGoogleEmail.split('@')[0], this.customGoogleEmail);
  }

  handleGoogleCredentialResponse(response: any) {
    if (!response?.credential) return;

    this.googleLoading.set(true);
    this.errorMessage.set('');

    this.authService.googleLogin({ credential: response.credential })
      .pipe(catchError(err => {
        this.googleLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Google sign in failed.');
        return of(null);
      }))
      .subscribe(res => {
        this.googleLoading.set(false);
        if (res?.success) {
          this.router.navigate(['/dashboard']);
        }
      });
  }

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

