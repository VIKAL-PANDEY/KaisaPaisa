import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <div class="page-header">
        <h1 class="page-title">Profile & Settings</h1>
        <p class="page-subtitle">Manage your personal details, theme appearance, default currency, and alert preferences.</p>
      </div>

      <div *ngIf="successMsg()" class="alert alert-success">
        {{ successMsg() }}
      </div>

      <div class="settings-grid">
        <!-- Personal Information Card -->
        <div class="kp-card">
          <h3>Personal Details</h3>
          <form (ngSubmit)="saveProfile()">
            <div class="form-group mt-3">
              <label class="form-label">Full Name</label>
              <input type="text" [(ngModel)]="name" name="name" class="form-control" required>
            </div>

            <div class="form-group">
              <label class="form-label">Email Address (Read-only)</label>
              <input type="email" [value]="user()?.email" class="form-control" disabled>
            </div>

            <button type="submit" class="btn btn-primary btn-sm">Update Profile</button>
          </form>
        </div>

        <!-- Appearance & Theme Preferences -->
        <div class="kp-card">
          <h3>Appearance & Theme</h3>
          <p class="desc">Default theme is light mode, or switch to dark mode at any time.</p>
          
          <div class="theme-options-grid mt-3">
            <div 
              class="theme-card-option" 
              [class.selected]="!themeService.isDarkMode()"
              (click)="themeService.setTheme('light')"
            >
              <div class="theme-icon-lg">☀️</div>
              <div class="theme-opt-title">Light Mode</div>
              <div class="theme-opt-desc">Default clean high-contrast fintech aesthetic</div>
            </div>

            <div 
              class="theme-card-option" 
              [class.selected]="themeService.isDarkMode()"
              (click)="themeService.setTheme('dark')"
            >
              <div class="theme-icon-lg">🌙</div>
              <div class="theme-opt-title">Dark Mode</div>
              <div class="theme-opt-desc">Dark fintech glassmorphic appearance</div>
            </div>
          </div>
        </div>

        <!-- Regional & Currency Preferences -->
        <div class="kp-card">
          <h3>Regional & Preferences</h3>
          <div class="form-group mt-3">
            <label class="form-label">Default Currency</label>
            <select [(ngModel)]="currency" class="form-control" (change)="saveProfile()">
              <option value="INR">Indian Rupee (₹ INR)</option>
              <option value="USD">US Dollar ($ USD)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Default Timezone</label>
            <select [(ngModel)]="timezone" class="form-control" (change)="saveProfile()">
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>

        <!-- Notification Preferences -->
        <div class="kp-card full-width">
          <h3>Notification Preferences</h3>
          <p class="desc">Configure automated threshold and milestone alert triggers.</p>

          <div class="toggle-list mt-3">
            <label class="toggle-item">
              <input type="checkbox" [(ngModel)]="notificationPreferences.budget80Warning" (change)="saveProfile()">
              <div>
                <div class="ti-title">80% Budget Warning Alert</div>
                <div class="ti-desc">Receive in-app warning notification when spending hits 80% of budget.</div>
              </div>
            </label>

            <label class="toggle-item">
              <input type="checkbox" [(ngModel)]="notificationPreferences.budget100Exceeded" (change)="saveProfile()">
              <div>
                <div class="ti-title">100% Budget Exceeded Alert</div>
                <div class="ti-desc">Receive alert when spending reaches or exceeds your budget limit.</div>
              </div>
            </label>

            <label class="toggle-item">
              <input type="checkbox" [(ngModel)]="notificationPreferences.debtReminders" (change)="saveProfile()">
              <div>
                <div class="ti-title">Debt & Lending Reminders</div>
                <div class="ti-desc">Alerts for upcoming and overdue money lent or borrowed.</div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-page { display: flex; flex-direction: column; gap: 20px; }
    .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

    @media (max-width: 800px) {
      .settings-grid { grid-template-columns: 1fr; }
    }

    .full-width { grid-column: 1 / -1; }
    .mt-3 { margin-top: 16px; }

    .desc { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }

    .theme-options-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .theme-card-option {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-card);
      padding: 14px;
      cursor: pointer;
      background: var(--surface-secondary);
      transition: var(--transition-fast);
      text-align: center;
    }

    .theme-card-option:hover {
      border-color: var(--border-hover);
      background: var(--surface-elevated);
    }

    .theme-card-option.selected {
      border-color: var(--color-primary);
      background: var(--color-primary-subtle);
      box-shadow: 0 0 0 1px var(--color-primary);
    }

    .theme-icon-lg {
      font-size: 24px;
      margin-bottom: 6px;
    }

    .theme-opt-title {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .theme-opt-desc {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .toggle-list { display: flex; flex-direction: column; gap: 16px; }

    .toggle-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background-color: var(--surface-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      cursor: pointer;
      transition: var(--transition-fast);
    }

    .toggle-item:hover {
      background-color: var(--surface-elevated);
      border-color: var(--border-hover);
    }

    .ti-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .ti-desc { font-size: 12.5px; color: var(--text-secondary); }

    .alert-success {
      background-color: var(--bg-income-light);
      color: var(--color-income);
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 13px;
    }
  `]
})
export class ProfileSettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private api = inject(ApiService);
  themeService = inject(ThemeService);

  user = this.authService.currentUser;
  successMsg = signal('');

  name = '';
  currency = 'INR';
  timezone = 'Asia/Kolkata';
  notificationPreferences = {
    budget80Warning: true,
    budget100Exceeded: true,
    debtReminders: true,
    recurringReminders: true
  };

  ngOnInit() {
    const u = this.user();
    if (u) {
      this.name = u.name;
      this.currency = u.currency || 'INR';
      this.timezone = u.timezone || 'Asia/Kolkata';
    }
  }

  saveProfile() {
    this.api.put<{ success: boolean; message: string; user: any }>('auth/profile', {
      name: this.name,
      currency: this.currency,
      timezone: this.timezone,
      notificationPreferences: this.notificationPreferences
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.authService.fetchProfile().subscribe();
          this.successMsg.set('Settings updated successfully!');
          setTimeout(() => this.successMsg.set(''), 3000);
        }
      }
    });
  }
}
