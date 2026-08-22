import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { tap, catchError, of } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  avatarUrl?: string;
  authProvider?: 'local' | 'google';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  currentUser = signal<User | null>(this.getStoredUser());
  token = signal<string | null>(localStorage.getItem('kp_token'));

  private getStoredUser(): User | null {
    const raw = localStorage.getItem('kp_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.token();
  }

  getGoogleConfig() {
    return this.api.get<{ clientId: string }>('auth/google-config');
  }

  googleLogin(payload: { credential?: string; profile?: { name?: string; email: string; googleId?: string; picture?: string } }) {
    return this.api.post<AuthResponse>('auth/google', payload).pipe(
      tap(res => {
        if (res.success && res.token && res.user) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  login(credentials: { email: string; password: string }) {
    return this.api.post<AuthResponse>('auth/login', credentials).pipe(
      tap(res => {
        if (res.success && res.token && res.user) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  register(data: { name: string; email: string; password: string }) {
    return this.api.post<AuthResponse>('auth/register', data).pipe(
      tap(res => {
        if (res.success && res.token && res.user) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  logout() {
    try {
      this.api.post('auth/logout', {}).pipe(
        catchError(() => of(null))
      ).subscribe({
        next: () => {},
        error: () => {}
      });
    } catch {
      // Ignore network errors during client cleanup
    }
    localStorage.removeItem('kp_token');
    localStorage.removeItem('kp_user');
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  fetchProfile() {
    if (!this.token()) return of(null);
    return this.api.get<{ success: boolean; user: User }>('auth/me').pipe(
      tap(res => {
        if (res.success && res.user) {
          this.currentUser.set(res.user);
          localStorage.setItem('kp_user', JSON.stringify(res.user));
        }
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  private setSession(token: string, user: User) {
    localStorage.setItem('kp_token', token);
    localStorage.setItem('kp_user', JSON.stringify(user));
    this.token.set(token);
    this.currentUser.set(user);
  }
}
