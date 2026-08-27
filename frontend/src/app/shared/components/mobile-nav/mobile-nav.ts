import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="mobile-nav">
      <a routerLink="/dashboard" routerLinkActive="active" class="mn-item">
        <span>Overview</span>
      </a>
      <a routerLink="/transactions" routerLinkActive="active" class="mn-item">
        <span>Transactions</span>
      </a>
      <a routerLink="/budgets" routerLinkActive="active" class="mn-item">
        <span>Budgets</span>
      </a>
      <a routerLink="/analytics" routerLinkActive="active" class="mn-item">
        <span>Analytics</span>
      </a>
      <a routerLink="/settings" routerLinkActive="active" class="mn-item">
        <span>More</span>
      </a>
    </nav>
  `,
  styles: [`
    .mobile-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: var(--glass-sidebar-bg);
      border-top: 1px solid var(--border-color);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      z-index: 999;
      justify-content: space-around;
      align-items: center;
    }

    .mn-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 0.70rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-secondary);
      text-decoration: none;
      width: 20%;
      height: 100%;
      transition: var(--transition-fast);
    }

    .mn-item.active {
      color: #C89B7B;
      font-weight: 700;
      border-top: 2px solid #C89B7B;
      background: rgba(200, 155, 123, 0.12);
    }

    @media (max-width: 768px) {
      .mobile-nav {
        display: flex;
      }
    }
  `]
})
export class MobileNavComponent {}
