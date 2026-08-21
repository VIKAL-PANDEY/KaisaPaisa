import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-coming-soon-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cs-card kp-card">
      <div class="cs-header">
        <div class="cs-icon-wrapper">
          <span class="cs-lock">🔒</span>
        </div>
        <span class="badge badge-coming-soon">COMING SOON</span>
      </div>
      <h3 class="cs-title">{{ title }}</h3>
      <p class="cs-description">{{ description }}</p>
      <div class="cs-meta" *ngIf="phase">
        Planned for Phase {{ phase }} • Post-MVP Scope
      </div>
    </div>
  `,
  styles: [`
    .cs-card {
      background-color: var(--surface-white);
      border: 1.5px dashed var(--border-color);
      border-radius: var(--radius-card);
      padding: 24px;
      position: relative;
      overflow: hidden;
    }

    .cs-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .cs-icon-wrapper {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background-color: #EDE7F6;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    .cs-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .cs-description {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .cs-meta {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
    }
  `]
})
export class ComingSoonCardComponent {
  @Input() title = 'Feature Name';
  @Input() description = 'Feature description teaser text.';
  @Input() phase = '5';
}
