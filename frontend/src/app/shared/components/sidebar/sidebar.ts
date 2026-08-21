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
        <div class="logo-box">KP</div>
        <div>
          <h2 class="brand-title">KAISAPAISA</h2>
          <p class="brand-tagline">Control your spending</p>
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
        <a routerLink="/accounts" routerLinkActive="active" class="nav-item">
          <span>Accounts</span>
        </a>
        <a routerLink="/reports" routerLinkActive="active" class="nav-item">
          <span>Reports</span>
        </a>

        <div class="nav-section-title">PERSONAL</div>
        <a routerLink="/settings" routerLinkActive="active" class="nav-item">
          <span>Settings & Profile</span>
        </a>

        <div class="nav-section-title">COMING SOON</div>
        <a routerLink="/coming-soon/ai-assistant" class="nav-item coming-soon-item">
          <span>AI Assistant</span>
          <span class="cs-badge">SOON</span>
        </a>
        <a routerLink="/coming-soon/student-deals" class="nav-item coming-soon-item">
          <span>Student Deals</span>
          <span class="cs-badge">SOON</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="avatar">{{ userInitials() }}</div>
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
      background-color: var(--surface-white);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: sticky;
      top: 0;
      padding: 24px 16px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 20px;
    }

    .logo-box {
      width: 36px;
      height: 36px;
      background-color: var(--text-primary);
      color: var(--surface-white);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
    }

    .brand-title {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.02em;
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
      transition: var(--transition-fast);
    }

    .nav-item:hover {
      background-color: var(--surface-secondary);
      color: var(--text-primary);
    }

    .nav-item.active {
      background-color: var(--bg-main);
      color: var(--text-primary);
      font-weight: 600;
    }

    .coming-soon-item {
      opacity: 0.8;
    }

    .cs-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 10px;
      background-color: #EDE7F6;
      color: #512DA8;
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
      background-color: var(--pastel-sage);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .user-name {
      font-size: 13px;
      font-weight: 600;
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
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
    }

    .logout-btn:hover {
      background-color: var(--bg-expense-light);
      color: var(--color-expense);
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
