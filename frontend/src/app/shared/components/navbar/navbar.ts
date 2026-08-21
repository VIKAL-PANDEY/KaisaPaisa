import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="top-nav">
      <div class="top-left">
        <span class="app-mobile-logo">KAISAPAISA</span>
      </div>

      <div class="top-actions">
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

    .app-mobile-logo {
      font-weight: 800;
      font-size: 16px;
      letter-spacing: -0.02em;
      display: none;
    }

    @media (max-width: 768px) {
      .app-mobile-logo { display: block; }
    }

    .top-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .notif-btn {
      background: var(--surface-white);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-btn);
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      position: relative;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: var(--transition-fast);
    }

    .notif-btn:hover {
      background-color: var(--surface-secondary);
    }

    .notif-badge {
      background-color: var(--color-expense);
      color: var(--surface-white);
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
      background: var(--surface-white);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-modal);
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
    }

    .btn-text {
      background: none;
      border: none;
      font-size: 12px;
      color: var(--text-secondary);
      cursor: pointer;
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
      font-size: 12px;
    }

    .notif-item.unread {
      border-left: 3px solid var(--pastel-peach);
      background-color: #FFF8E1;
    }

    .notif-title {
      font-weight: 600;
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
