import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar">
      <div class="brand">
        <img src="/kaisapaisa-logo.png" alt="KaisaPaisa" class="sidebar-logo-img">
        <div>
          <h2 class="brand-title">KAISAPAISA</h2>
          <p class="brand-tagline">Smart Finance Platform</p>
        </div>
      </div>

      <nav class="nav-menu">
        <div class="nav-section-title">SMART FINANCE</div>
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
          <span>Overview</span>
        </a>
        <a routerLink="/transactions" routerLinkActive="active" class="nav-item">
          <span>Transactions</span>
        </a>
        <a routerLink="/budgets" routerLinkActive="active" class="nav-item">
          <span>Budgets</span>
        </a>
        <a routerLink="/analytics" routerLinkActive="active" class="nav-item">
          <span>Analytics</span>
        </a>
        <a routerLink="/calendar" routerLinkActive="active" class="nav-item">
          <span>Financial Calendar</span>
        </a>
        <a routerLink="/goals" routerLinkActive="active" class="nav-item">
          <span>Savings Goals</span>
        </a>

        <div class="nav-section-title">MANAGEMENT</div>
        <a routerLink="/recurring" routerLinkActive="active" class="nav-item">
          <span>Recurring Payments</span>
        </a>
        <a routerLink="/debt-lending" routerLinkActive="active" class="nav-item">
          <span>Debt & Lending</span>
        </a>
        <a routerLink="/reports" routerLinkActive="active" class="nav-item">
          <span>Reports</span>
        </a>

        <div class="nav-section-title">PERSONAL</div>
        <a routerLink="/settings" routerLinkActive="active" class="nav-item">
          <span>Settings & Profile</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          @if (user()?.avatarUrl) {
            <img [src]="user()?.avatarUrl" class="avatar avatar-img" alt="avatar" />
          } @else {
            <div class="avatar">{{ userInitials() }}</div>
          }
          <div class="user-details">
            <span class="user-name">{{ user()?.name || 'User' }}</span>
            <span class="user-email">{{ user()?.email }}</span>
          </div>
        </div>
        <button (click)="logout()" class="logout-btn" title="Logout">
          <span>Logout</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      background: var(--glass-sidebar-bg);
      border-right: 1px solid var(--border-color);
      backdrop-filter: var(--glass-blur-strong);
      -webkit-backdrop-filter: var(--glass-blur-strong);
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: sticky;
      top: 0;
      padding: 24px 16px;
      z-index: 50;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 20px;
    }

    .sidebar-logo-img {
      width: 38px;
      height: 38px;
      object-fit: contain;
      border-radius: 9px;
      background-color: #FFFFFF;
      padding: 2px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    }

    .brand-title {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text-primary);
    }

    .brand-tagline {
      font-size: 11px;
      color: var(--text-secondary);
    }

    .nav-menu {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-section-title {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-top: 14px;
      margin-bottom: 6px;
      padding-left: 10px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      font-size: 13.5px;
      font-weight: 500;
      color: var(--text-secondary);
      text-decoration: none;
      border-radius: var(--radius-btn);
      border: 1px solid transparent;
      transition: var(--transition-fast);
    }

    .nav-item:hover {
      background-color: var(--surface-secondary);
      color: var(--text-primary);
      border-color: var(--border-hover);
    }

    .nav-item.active {
      background-color: var(--color-primary);
      background-image: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
      color: #FFFFFF;
      font-weight: 600;
      border: 1px solid rgba(151, 185, 255, 0.25);
      box-shadow: 0 2px 10px rgba(38, 34, 98, 0.35);
    }

    .sidebar-footer {
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      overflow: hidden;
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: var(--color-primary);
      color: #FFFFFF;
      border: 1px solid rgba(151, 185, 255, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }

    .avatar-img {
      object-fit: cover;
      border: 1px solid var(--border-color);
    }

    .user-details {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      font-size: 11px;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .logout-btn {
      background: var(--surface-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: var(--transition-fast);
    }

    .logout-btn:hover {
      background-color: var(--bg-expense-light);
      color: var(--color-expense);
      border-color: rgba(229, 115, 115, 0.3);
    }

    @media (max-width: 768px) {
      .sidebar {
        display: none;
      }
    }
  `]
})
export class SidebarComponent {
  private authService = inject(AuthService);
  user = this.authService.currentUser;

  userInitials(): string {
    const name = this.user()?.name || 'User';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  logout() {
    this.authService.logout();
  }
}
