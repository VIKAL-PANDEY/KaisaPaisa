import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <div class="page-header">
        <h1 class="page-title">Profile & Settings</h1>
        <p class="page-subtitle">Manage your personal details, default currency, and alert preferences.</p>
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

    .toggle-list { display: flex; flex-direction: column; gap: 16px; }

    .toggle-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background-color: var(--surface-secondary);
      border-radius: 8px;
      cursor: pointer;
    }

    .ti-title { font-size: 14px; font-weight: 600; }
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
