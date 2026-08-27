import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="top-nav">
      <div class="top-left">
        <img src="/kaisapaisa-logo.png" alt="KaisaPaisa" class="app-mobile-logo-img">
        <span class="app-mobile-logo">KAISAPAISA</span>
      </div>

      <div class="top-actions">
        <!-- Theme Mode Toggle Button -->
        <button 
          (click)="themeService.toggleTheme()" 
          class="theme-toggle-btn"
          [attr.aria-label]="themeService.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          [title]="themeService.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          @if (themeService.isDarkMode()) {
            <span class="theme-icon">☀️</span>
            <span class="theme-label">Light</span>
          } @else {
            <span class="theme-icon">🌙</span>
            <span class="theme-label">Dark</span>
          }
        </button>

        <button (click)="toggleNotifications()" class="notif-btn" title="Notifications">
          <span>🔔</span>
          @if (unreadCount() > 0) {
            <span class="notif-badge">{{ unreadCount() }}</span>
          }
        </button>
      </div>

      <!-- Notifications Dropdown Drawer -->
      @if (showNotifications()) {
        <div class="notif-drawer">
          <div class="nd-header">
            <h3>Notifications</h3>
            <button (click)="markAllAsRead()" class="btn-text">Mark all read</button>
          </div>
          <div class="nd-body">
            @if (notifications().length === 0) {
              <div class="empty-notif">No notifications yet</div>
            }
            @for (n of notifications(); track n._id) {
              <div class="notif-item" [class.unread]="!n.isRead">
                <div class="notif-title">{{ n.title }}</div>
                <div class="notif-msg">{{ n.message }}</div>
                <div class="notif-time">{{ n.createdAt | date:'shortTime' }}</div>
              </div>
            }
          </div>
        </div>
      }
    </header>
  `,
  styles: [`
    .top-nav {
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 24px;
      position: relative;
    }

    .top-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .app-mobile-logo-img {
      width: 28px;
      height: 28px;
      object-fit: contain;
      border-radius: 6px;
      display: none;
    }

    .app-mobile-logo {
      font-family: var(--font-serif);
      font-weight: 600;
      font-size: 18px;
      letter-spacing: 0.05em;
      color: var(--text-primary);
      display: none;
    }

    @media (max-width: 768px) {
      .app-mobile-logo, .app-mobile-logo-img { display: block; }
    }

    .top-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-left: auto;
    }

    .theme-toggle-btn {
      background: var(--surface-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-btn);
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      transition: var(--transition-fast);
    }

    .theme-toggle-btn:hover {
      background-color: var(--surface-elevated);
      border-color: var(--border-hover);
      transform: translateY(-1px);
    }

    .theme-icon {
      font-size: 14px;
      line-height: 1;
    }

    .theme-label {
      font-size: 12px;
    }

    .notif-btn {
      background: var(--surface-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-btn);
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      cursor: pointer;
      position: relative;
      display: flex;
      align-items: center;
      gap: 6px;
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      transition: var(--transition-fast);
    }

    .notif-btn:hover {
      background-color: var(--surface-elevated);
      border-color: var(--border-hover);
    }

    .notif-badge {
      background-color: var(--color-expense);
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 10px;
    }

    .notif-drawer {
      position: absolute;
      top: 50px;
      right: 0;
      width: 340px;
      background: var(--glass-modal-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-modal);
      backdrop-filter: var(--glass-blur-strong);
      -webkit-backdrop-filter: var(--glass-blur-strong);
      z-index: 99;
      padding: 16px;
    }

    .nd-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 8px;
      margin-bottom: 12px;
    }

    .nd-header h3 {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .btn-text {
      background: none;
      border: none;
      font-size: 12px;
      color: var(--color-soft-blue);
      cursor: pointer;
      font-weight: 500;
    }

    .btn-text:hover {
      text-decoration: underline;
    }

    .nd-body {
      max-height: 300px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .notif-item {
      padding: 10px;
      border-radius: 6px;
      background-color: var(--surface-secondary);
      border: 1px solid var(--border-color);
      font-size: 12px;
    }

    .notif-item.unread {
      border-left: 3px solid var(--color-soft-blue);
      background-color: var(--color-soft-blue-subtle);
      border-top-color: var(--border-hover);
      border-right-color: var(--border-hover);
      border-bottom-color: var(--border-hover);
    }

    .notif-title {
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 2px;
    }

    .notif-msg { color: var(--text-secondary); }
    .notif-time { font-size: 10px; color: var(--text-muted); margin-top: 4px; }

    .empty-notif {
      text-align: center;
      color: var(--text-secondary);
      font-size: 13px;
      padding: 20px 0;
    }
  `]
})
export class NavbarComponent implements OnInit {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  themeService = inject(ThemeService);

  showNotifications = signal(false);
  unreadCount = signal(0);
  notifications = signal<any[]>([]);

  ngOnInit() {
    // Only load notifications if authenticated
    if (this.authService.isAuthenticated()) {
      this.loadNotifications();
    }
  }

  loadNotifications() {
    this.api.get<{ success: boolean; unreadCount: number; notifications: any[] }>('notifications')
      .pipe(catchError(() => of({ success: false, unreadCount: 0, notifications: [] })))
      .subscribe(res => {
        if (res.success) {
          this.unreadCount.set(res.unreadCount);
          this.notifications.set(res.notifications);
        }
      });
  }

  toggleNotifications() {
    this.showNotifications.set(!this.showNotifications());
  }

  markAllAsRead() {
    this.api.put('notifications/read-all')
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.unreadCount.set(0);
        this.loadNotifications();
      });
  }
}

