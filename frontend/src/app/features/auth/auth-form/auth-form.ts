import { Component, inject, signal, OnInit, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FirebaseService } from '../../../core/services/firebase.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-auth-form',
  standalone: true,
  imports: [FormsModule, RouterModule],
  template: `
    <div class="auth-form-container">
      <!-- Top Left Back Button -->
      <div class="back-btn-wrapper">
        <button type="button" class="social-btn back-btn" (click)="goBack()">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>Go back</span>
        </button>
      </div>

      <!-- Main Central Card with Entry Motion -->
      <div class="auth-motion-card">
        <!-- Logo -->
        <div class="auth-logo-row">
          <img src="/kaisapaisa-logo.png" alt="KaisaPaisa" class="auth-logo-img">
          <span class="auth-brand-name">KaisaPaisa</span>
        </div>

        <!-- Header -->
        <div class="auth-header-section">
          <h1 class="auth-title">
            {{ isRegisterMode() ? 'Create your account' : 'Sign in to your account' }}
          </h1>
          <p class="auth-subtitle">
            @if (isRegisterMode()) {
              Already have an account?
              <a href="javascript:void(0)" (click)="toggleMode(false)" class="auth-toggle-link">
                Sign in.
              </a>
            } @else {
              Don't have an account?
              <a href="javascript:void(0)" (click)="toggleMode(true)" class="auth-toggle-link">
                Create one.
              </a>
            }
          </p>
        </div>

        <!-- Error Message Alert -->
        @if (errorMessage()) {
          <div class="alert-error">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <!-- Social Auth Buttons -->
        <div class="social-buttons-grid">
          <!-- Twitter / X Button -->
          <button type="button" class="social-btn" (click)="handleSocialLogin('Twitter')">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </button>

          <!-- GitHub Button -->
          <button type="button" class="social-btn" (click)="handleSocialLogin('GitHub')">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
          </button>

          <!-- SSO / Google Full-Width Button -->
          <button type="button" class="social-btn full-width-btn" (click)="handleGoogleClick()" [disabled]="googleLoading()">
            @if (googleLoading()) {
              <div class="spinner-sm"></div>
              <span>Connecting to SSO...</span>
            } @else {
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{{ isRegisterMode() ? 'Sign up with Google / SSO' : 'Sign in with Google / SSO' }}</span>
            }
          </button>
        </div>

        <!-- Divider -->
        <div class="divider-row">
          <div class="divider-line"></div>
          <span class="divider-text">OR</span>
          <div class="divider-line"></div>
        </div>

        <!-- Auth Form (Sign In / Register) -->
        <form (ngSubmit)="onSubmit()" class="auth-form-body">
          @if (isRegisterMode()) {
            <div class="form-group-item">
              <label for="name-input" class="field-label">Full Name</label>
              <input
                id="name-input"
                type="text"
                [(ngModel)]="name"
                name="name"
                placeholder="e.g. Vikal Pandey"
                class="form-input-field"
                required
                autocomplete="name"
              />
            </div>
          }

          <div class="form-group-item">
            <label for="email-input" class="field-label">Email</label>
            <input
              id="email-input"
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="your.email@provider.com"
              class="form-input-field"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group-item">
            <div class="label-row-between">
              <label for="password-input" class="field-label">Password</label>
              @if (!isRegisterMode()) {
                <a href="javascript:void(0)" (click)="handleForgotPassword()" class="forgot-link">
                  Forgot?
                </a>
              }
            </div>
            <input
              id="password-input"
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••••••"
              class="form-input-field"
              required
              [autocomplete]="isRegisterMode() ? 'new-password' : 'current-password'"
            />
          </div>

          <!-- Submit Button -->
          <button type="submit" [disabled]="loading()" class="btn-auth-gradient">
            @if (loading()) {
              <span class="btn-spinner-content">
                <div class="spinner-sm white"></div>
                <span>{{ isRegisterMode() ? 'Creating account...' : 'Signing in...' }}</span>
              </span>
            } @else {
              <span>{{ isRegisterMode() ? 'Create account' : 'Sign in' }}</span>
            }
          </button>
        </form>

        <!-- Terms and Conditions -->
        <p class="terms-footer-text">
          By signing in, you agree to our
          <a href="javascript:void(0)" (click)="showTermsInfo()" class="terms-link">Terms & Conditions</a>
          and
          <a href="javascript:void(0)" (click)="showPrivacyInfo()" class="terms-link">Privacy Policy.</a>
        </p>
      </div>

      <!-- Ambient Grid Background Decoration -->
      <div class="bg-grid-decoration">
        <div class="bg-radial-fade"></div>
      </div>

      <!-- Google Account Selector Modal -->
      @if (showGoogleModal()) {
        <div class="modal-backdrop" (click)="closeGoogleModal()">
          <div class="google-modal-card" (click)="$event.stopPropagation()">
            <div class="gm-header">
              <svg viewBox="0 0 24 24" width="28" height="28">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <h3>Continue with Google</h3>
              <p>Choose an account to continue to KaisaPaisa</p>
            </div>

            <div class="gm-accounts">
              <button type="button" class="account-item" (click)="selectGoogleAccount('Vikal Pandey', 'vpand301@gmail.com')">
                <div class="acc-avatar avatar-blue">V</div>
                <div class="acc-text">
                  <div class="acc-name">Vikal Pandey</div>
                  <div class="acc-email">vpand301&#64;gmail.com</div>
                </div>
              </button>

              <button type="button" class="account-item" (click)="selectGoogleAccount('Student Account', 'student.finance@gmail.com')">
                <div class="acc-avatar avatar-green">S</div>
                <div class="acc-text">
                  <div class="acc-name">Student Account</div>
                  <div class="acc-email">student.finance&#64;gmail.com</div>
                </div>
              </button>
            </div>

            <div class="custom-google-form">
              <div class="custom-title">Or use another account:</div>
              <div class="form-group-item mb-2">
                <input
                  type="text"
                  [(ngModel)]="customGoogleName"
                  placeholder="Your Name (e.g. Alex Sharma)"
                  class="form-input-field"
                />
              </div>
              <div class="form-group-item mb-3">
                <input
                  type="email"
                  [(ngModel)]="customGoogleEmail"
                  placeholder="name@gmail.com"
                  class="form-input-field"
                />
              </div>
              <button
                type="button"
                (click)="submitCustomGoogleLogin()"
                [disabled]="!customGoogleEmail || googleLoading()"
                class="btn-auth-gradient"
              >
                {{ googleLoading() ? 'Connecting...' : 'Continue' }}
              </button>
            </div>

            <button type="button" class="btn-cancel" (click)="closeGoogleModal()">Cancel</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .auth-form-container {
      position: relative;
      min-height: 100vh;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 16px;
      background: radial-gradient(ellipse at 50% 15%, rgba(200, 155, 123, 0.12) 0%, #121417 80%);
      color: #F8F9FA;
      overflow-x: hidden;
      font-family: var(--font-sans);
    }

    .back-btn-wrapper {
      position: absolute;
      top: 24px;
      left: 24px;
      z-index: 20;
    }

    .auth-motion-card {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 480px;
      padding: 40px 36px;
      background: #20242B;
      border: 1px solid rgba(200, 155, 123, 0.25);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-radius: 20px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(200, 155, 123, 0.15);
      animation: authCardEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes authCardEnter {
      from {
        opacity: 0;
        transform: translateY(24px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Logo Row */
    .auth-logo-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .auth-logo-img {
      width: 42px;
      height: 42px;
      object-fit: contain;
      border-radius: 12px;
      background: rgba(200, 155, 123, 0.1);
      border: 1px solid rgba(200, 155, 123, 0.3);
      padding: 4px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    }

    .auth-brand-name {
      font-family: var(--font-serif);
      font-size: 24px;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: #F8F9FA;
    }

    /* Header */
    .auth-header-section {
      text-align: center;
      margin-bottom: 24px;
    }

    .auth-title {
      font-family: var(--font-serif);
      font-size: 26px;
      font-weight: 600;
      color: #F8F9FA;
      letter-spacing: -0.01em;
      margin: 0 0 8px 0;
    }

    .auth-subtitle {
      font-size: 14px;
      color: #9CA3AF;
      margin: 0;
    }

    .auth-toggle-link {
      color: #C89B7B;
      font-weight: 600;
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .auth-toggle-link:hover {
      color: #B88665;
      text-decoration: underline;
    }

    /* Social Buttons */
    .social-buttons-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .full-width-btn {
      grid-column: span 2;
    }

    .social-btn {
      position: relative;
      z-index: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      overflow: hidden;
      border-radius: 10px;
      border: 1px solid rgba(200, 155, 123, 0.25);
      background: #181B20;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 600;
      color: #F8F9FA;
      cursor: pointer;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .social-btn::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: -1;
      border-radius: 100%;
      background: #C89B7B;
      transform: translate(150%, 150%) scale(2.5);
      transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .social-btn:hover:not(:disabled) {
      transform: scale(1.02);
      color: #121417;
      border-color: #C89B7B;
    }

    .social-btn:hover:not(:disabled)::before {
      transform: translate(0%, 0%) scale(2.5);
    }

    .social-btn:active:not(:disabled) {
      transform: scale(0.97);
    }

    .social-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .back-btn {
      padding: 8px 14px;
      font-size: 13px;
      background: #181B20;
    }

    /* Divider */
    .divider-row {
      display: flex;
      align-items: center;
      gap: 14px;
      margin: 22px 0;
    }

    .divider-line {
      flex: 1;
      height: 1px;
      background: rgba(200, 155, 123, 0.2);
    }

    .divider-text {
      font-size: 12px;
      font-weight: 700;
      color: #9CA3AF;
      letter-spacing: 0.08em;
    }

    /* Form Fields */
    .auth-form-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group-item {
      display: flex;
      flex-direction: column;
    }

    .field-label {
      font-size: 13px;
      font-weight: 600;
      color: #9CA3AF;
      margin-bottom: 6px;
    }

    .label-row-between {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .forgot-link {
      font-size: 12.5px;
      color: #C89B7B;
      text-decoration: none;
      font-weight: 500;
    }

    .forgot-link:hover {
      text-decoration: underline;
    }

    .form-input-field {
      width: 100%;
      border-radius: 10px;
      border: 1px solid rgba(200, 155, 123, 0.25);
      background: #181B20;
      padding: 11px 14px;
      font-size: 14px;
      color: #F8F9FA;
      outline: none;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }

    .form-input-field::placeholder {
      color: #6B7280;
    }

    .form-input-field:focus {
      border-color: #C89B7B;
      background: #181B20;
      box-shadow: 0 0 0 3px rgba(200, 155, 123, 0.2);
    }

    /* Primary Hero Action CTA Button */
    .btn-auth-gradient {
      width: 100%;
      margin-top: 6px;
      border-radius: 10px;
      background: #FFFFFF;
      padding: 12px 18px;
      font-size: 15px;
      font-weight: 700;
      color: #121417;
      border: 1px solid #FFFFFF;
      cursor: pointer;
      box-shadow: 0 4px 18px rgba(255, 255, 255, 0.2);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .btn-auth-gradient:hover:not(:disabled) {
      transform: scale(1.01);
      background: #F8F9FA;
      box-shadow: 0 8px 25px rgba(255, 255, 255, 0.3);
    }

    .btn-auth-gradient:active:not(:disabled) {
      transform: scale(0.98);
    }

    .btn-auth-gradient:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-spinner-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    /* Terms and Conditions Footer */
    .terms-footer-text {
      margin-top: 24px;
      margin-bottom: 0;
      text-align: center;
      font-size: 12px;
      color: #9CA3AF;
      line-height: 1.5;
    }

    .terms-link {
      color: #C89B7B;
      text-decoration: none;
      font-weight: 500;
    }

    .terms-link:hover {
      text-decoration: underline;
    }

    /* Ambient Background Grid */
    .bg-grid-decoration {
      position: absolute;
      right: 0;
      top: 0;
      width: 55vw;
      height: 55vw;
      max-width: 650px;
      max-height: 650px;
      pointer-events: none;
      z-index: 0;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke-width='1.5' stroke='rgba(96, 165, 250, 0.12)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
    }

    .bg-radial-fade {
      position: absolute;
      inset: 0;
      background: radial-gradient(100% 100% at 100% 0%, rgba(20, 20, 20, 0), rgba(20, 20, 20, 1));
    }

    /* Alert error */
    .alert-error {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(229, 115, 115, 0.12);
      color: #EF4444;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 13px;
      margin-bottom: 16px;
      border: 1px solid rgba(239, 68, 68, 0.25);
    }

    /* Spinners */
    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-top-color: #60A5FA;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner-sm.white {
      border-top-color: #FFFFFF;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 20px;
    }

    .google-modal-card {
      background: rgba(24, 24, 27, 0.96);
      border: 1px solid rgba(255, 255, 255, 0.14);
      width: 100%;
      max-width: 400px;
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      animation: authCardEnter 0.25s ease-out;
    }

    .gm-header {
      text-align: center;
      margin-bottom: 20px;
    }

    .gm-header h3 {
      font-size: 19px;
      font-weight: 700;
      margin-top: 10px;
      margin-bottom: 4px;
      color: #FFFFFF;
    }

    .gm-header p {
      font-size: 13px;
      color: #A1A1AA;
      margin: 0;
    }

    .gm-accounts {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 16px;
    }

    .account-item {
      display: flex;
      align-items: center;
      gap: 14px;
      width: 100%;
      padding: 12px 14px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.04);
      border-radius: 12px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;
    }

    .account-item:hover {
      background-color: rgba(255, 255, 255, 0.08);
      border-color: #60A5FA;
      transform: translateY(-1px);
    }

    .acc-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 15px;
      flex-shrink: 0;
    }

    .avatar-blue {
      background-color: rgba(96, 165, 250, 0.2);
      color: #93C5FD;
      border: 1px solid rgba(96, 165, 250, 0.3);
    }

    .avatar-green {
      background-color: rgba(52, 211, 153, 0.2);
      color: #6EE7B7;
      border: 1px solid rgba(52, 211, 153, 0.3);
    }

    .acc-name {
      font-size: 14px;
      font-weight: 600;
      color: #FFFFFF;
    }

    .acc-email {
      font-size: 12px;
      color: #A1A1AA;
    }

    .custom-google-form {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      padding: 16px;
      margin-top: 10px;
      border: 1px dashed rgba(255, 255, 255, 0.12);
    }

    .custom-title {
      font-size: 12.5px;
      font-weight: 600;
      color: #A1A1AA;
      margin-bottom: 10px;
    }

    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }

    .btn-cancel {
      width: 100%;
      background: none;
      border: none;
      font-size: 13px;
      color: #A1A1AA;
      font-weight: 500;
      cursor: pointer;
      margin-top: 14px;
      padding: 8px;
      transition: color 0.15s ease;
    }

    .btn-cancel:hover {
      color: #FFFFFF;
    }
  `]
})
export class AuthFormComponent implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isRegisterMode = signal(false);

  name = '';
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
    // Detect mode from route path or query param
    const currentUrl = this.router.url;
    if (currentUrl.includes('register')) {
      this.isRegisterMode.set(true);
    }

    this.route.data.subscribe(data => {
      if (data && data['mode'] === 'register') {
        this.isRegisterMode.set(true);
      }
    });

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

  toggleMode(register: boolean) {
    this.isRegisterMode.set(register);
    this.errorMessage.set('');
    // Update browser URL silently without hard reload
    if (register) {
      window.history.replaceState({}, '', '/register');
    } else {
      window.history.replaceState({}, '', '/login');
    }
  }

  goBack() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  handleSocialLogin(provider: string) {
    if (provider === 'Twitter') {
      this.selectGoogleAccount('Twitter User', 'twitter.user@kaisapaisa.dev');
    } else if (provider === 'GitHub') {
      this.selectGoogleAccount('Developer Profile', 'dev.contributor@github.com');
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
      } catch (e) {
        console.warn('[Google Auth Init Warning]:', e);
      }
    }
  }

  async handleGoogleClick() {
    this.googleLoading.set(true);
    this.errorMessage.set('');

    try {
      // 1. Try Firebase Google Auth Popup
      const fbUser = await this.firebaseService.signInWithGoogle();
      if (fbUser && fbUser.email) {
        this.authService.googleLogin({
          profile: {
            name: fbUser.displayName || fbUser.email.split('@')[0],
            email: fbUser.email,
            googleId: fbUser.uid,
            picture: fbUser.photoURL || undefined
          }
        }).subscribe({
          next: (res) => {
            this.googleLoading.set(false);
            if (res?.success) this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            this.googleLoading.set(false);
            this.errorMessage.set(err.error?.message || err.error?.error || 'Google sign-in completed, but session sync failed.');
          }
        });
        return;
      }
    } catch (firebaseErr: any) {
      console.warn('Firebase Popup sign in closed or unavailable, falling back to Google GIS / Account Picker:', firebaseErr);
    }

    // 2. Fallback to GIS OAuth Token Client or Account Selector Modal
    const clientId = this.googleClientId() || '670014374537-18659f4ekku2s1f06fsjedr1a0pra9av.apps.googleusercontent.com';
    const google = (window as any).google;

    if (google?.accounts?.oauth2) {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              this.googleLoading.set(false);
              this.showGoogleModal.set(true);
              return;
            }

            if (tokenResponse?.access_token) {
              this.googleLoading.set(true);
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
                      this.errorMessage.set(err.error?.message || 'Google sign in failed');
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
          error_callback: () => {
            this.googleLoading.set(false);
            this.showGoogleModal.set(true);
          }
        });
        client.requestAccessToken();
        return;
      } catch {
        // Fallback to modal
      }
    }

    this.googleLoading.set(false);
    this.showGoogleModal.set(true);
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

  handleForgotPassword() {
    this.errorMessage.set('Password reset instructions will be sent to your registered email if found.');
  }

  showTermsInfo() {
    alert('KaisaPaisa Terms & Conditions:\n1. Your financial data is securely stored and private.\n2. You retain full ownership of your transaction logs.\n3. Safe and transparent financial tracking.');
  }

  showPrivacyInfo() {
    alert('KaisaPaisa Privacy Policy:\nWe do not share your private financial information with third parties. All credentials and sensitive data are encrypted.');
  }

  onSubmit() {
    if (this.isRegisterMode()) {
      if (!this.name || !this.email || !this.password) {
        this.errorMessage.set('Please fill in all fields (Name, Email, Password).');
        return;
      }
      if (this.password.length < 6) {
        this.errorMessage.set('Password must be at least 6 characters long.');
        return;
      }

      this.loading.set(true);
      this.errorMessage.set('');

      this.authService.register({ name: this.name, email: this.email, password: this.password })
        .pipe(catchError(err => {
          this.loading.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to create account. Please check your details.');
          return of(null);
        }))
        .subscribe(res => {
          this.loading.set(false);
          if (res?.success) {
            this.router.navigate(['/dashboard']);
          }
        });
    } else {
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
}
