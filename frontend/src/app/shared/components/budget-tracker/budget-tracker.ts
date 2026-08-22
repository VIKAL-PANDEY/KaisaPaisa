import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BudgetData {
  _id?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'category' | string;
  categoryId?: string;
  categoryName?: string;
  limitAmount: number;
  spentAmount: number;
  remainingAmount?: number;
  utilizationPercentage?: number;
  status?: 'NORMAL' | 'WARNING' | 'EXCEEDED' | string;
  currencySymbol?: string;
  startDate?: string | Date;
  endDate?: string | Date;
}

@Component({
  selector: 'app-budget-tracker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Compact Mode (for list rows and dashboard widgets) -->
    <div *ngIf="compact" class="budget-tracker-compact" [id]="id || ('budget-tracker-' + (_id || 'compact'))">
      <div class="btc-header">
        <div class="btc-info">
          <span class="btc-title">{{ displayTitle }}</span>
          <span *ngIf="displaySubtitle" class="btc-subtitle">{{ displaySubtitle }}</span>
        </div>
        <div class="btc-values">
          <span class="btc-spent">{{ currencySymbol }}{{ calculatedSpent | number:'1.2-2' }}</span>
          <span class="btc-limit">/ {{ currencySymbol }}{{ calculatedLimit | number:'1.0-0' }}</span>
        </div>
      </div>

      <!-- Existing Progress Bar Styles -->
      <div class="progress-bar-bg" [title]="percentage + '% utilized'">
        <div
          class="progress-bar-fill"
          [style.width.%]="fillWidth"
          [class.fill-normal]="statusClass === 'NORMAL'"
          [class.fill-warning]="statusClass === 'WARNING'"
          [class.fill-exceeded]="statusClass === 'EXCEEDED'"
          role="progressbar"
          [attr.aria-valuenow]="percentage"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>

      <div class="btc-footer">
        <span
          class="badge"
          [class.badge-normal]="statusClass === 'NORMAL'"
          [class.badge-warning]="statusClass === 'WARNING'"
          [class.badge-exceeded]="statusClass === 'EXCEEDED'"
        >
          {{ statusClass }} ({{ percentage }}%)
        </span>

        <span class="btc-rem" [class.text-danger]="statusClass === 'EXCEEDED'">
          {{ statusClass === 'EXCEEDED' ? 'Exceeded by ' : '' }}{{ currencySymbol }}{{ (statusClass === 'EXCEEDED' ? excessAmount : remaining) | number:'1.2-2' }} {{ statusClass === 'EXCEEDED' ? '' : 'remaining' }}
        </span>
      </div>
    </div>

    <!-- Full Card Mode (for dedicated Budget page / Detailed Cards) -->
    <div *ngIf="!compact" class="budget-tracker-card kp-card" [id]="id || ('budget-tracker-' + (_id || 'card'))">
      <div class="bc-header">
        <div class="bc-period-tag">
          <span class="badge" [class.badge-coming-soon]="period === 'category'">
            {{ (period || 'BUDGET') | uppercase }} {{ categoryName ? '• ' + categoryName : '' }}
          </span>
        </div>
        <button
          *ngIf="showDelete"
          (click)="onDelete()"
          class="delete-btn"
          title="Delete Budget"
          aria-label="Delete Budget"
        >
          &times;
        </button>
      </div>

      <div class="bc-amount-row">
        <span class="spent-val">{{ currencySymbol }}{{ calculatedSpent | number:'1.2-2' }}</span>
        <span class="limit-val">/ {{ currencySymbol }}{{ calculatedLimit | number:'1.0-0' }}</span>
      </div>

      <!-- Existing Progress Bar Styles -->
      <div class="progress-bar-bg" [title]="percentage + '% utilized'">
        <div
          class="progress-bar-fill"
          [style.width.%]="fillWidth"
          [class.fill-normal]="statusClass === 'NORMAL'"
          [class.fill-warning]="statusClass === 'WARNING'"
          [class.fill-exceeded]="statusClass === 'EXCEEDED'"
          role="progressbar"
          [attr.aria-valuenow]="percentage"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>

      <div class="bc-footer">
        <span
          class="status-badge"
          [class.status-normal]="statusClass === 'NORMAL'"
          [class.status-warning]="statusClass === 'WARNING'"
          [class.status-exceeded]="statusClass === 'EXCEEDED'"
        >
          {{ statusClass }} ({{ percentage }}%)
        </span>

        <span class="rem-text" [class.text-danger]="statusClass === 'EXCEEDED'">
          {{ statusClass === 'EXCEEDED' ? 'Exceeded by ' : '' }}{{ currencySymbol }}{{ (statusClass === 'EXCEEDED' ? excessAmount : remaining) | number:'1.2-2' }} {{ statusClass === 'EXCEEDED' ? '' : 'remaining' }}
        </span>
      </div>

      <!-- Exceeded / Warning Note -->
      <div *ngIf="statusClass === 'EXCEEDED'" class="alert-exceeded">
        <span class="alert-icon">⚠️</span>
        <span>Budget limit has been exceeded for this period.</span>
      </div>
      <div *ngIf="statusClass === 'WARNING'" class="alert-warning">
        <span class="alert-icon">⚡</span>
        <span>Approaching budget limit (over 80% used).</span>
      </div>
    </div>
  `,
  styles: [`
    /* Compact Mode Styles */
    .budget-tracker-compact {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }

    .btc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .btc-info {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btc-title {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .btc-subtitle {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .btc-values {
      font-size: 13px;
      font-feature-settings: "tnum";
    }

    .btc-spent {
      font-weight: 600;
      color: var(--text-primary);
    }

    .btc-limit {
      color: var(--text-secondary);
      font-size: 12px;
    }

    .btc-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
    }

    .btc-rem {
      color: var(--text-secondary);
      font-weight: 500;
      font-feature-settings: "tnum";
    }

    /* Card Mode Styles */
    .budget-tracker-card {
      display: flex;
      flex-direction: column;
      gap: 14px;
      position: relative;
    }

    .bc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .delete-btn {
      background: none;
      border: none;
      font-size: 20px;
      line-height: 1;
      color: var(--text-muted);
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      transition: var(--transition-fast);
    }

    .delete-btn:hover {
      color: var(--color-expense);
      background-color: var(--bg-expense-light);
    }

    .bc-amount-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
      font-feature-settings: "tnum";
    }

    .spent-val {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .limit-val {
      font-size: 14px;
      color: var(--text-secondary);
    }

    .bc-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12.5px;
    }

    .status-badge {
      font-weight: 700;
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 12px;
    }

    .status-normal {
      background-color: var(--bg-income-light);
      color: var(--color-income);
    }

    .status-warning {
      background-color: var(--bg-warning-light);
      color: var(--color-warning);
    }

    .status-exceeded {
      background-color: var(--bg-expense-light);
      color: var(--color-expense);
    }

    .rem-text {
      color: var(--text-secondary);
      font-weight: 500;
      font-feature-settings: "tnum";
    }

    .text-danger {
      color: var(--color-expense) !important;
      font-weight: 600;
    }

    /* Inline Contextual Alerts */
    .alert-exceeded,
    .alert-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      padding: 6px 10px;
      border-radius: var(--radius-input);
      font-weight: 500;
    }

    .alert-exceeded {
      background-color: var(--bg-expense-light);
      color: var(--color-expense);
      border: 1px solid #FFCDD2;
    }

    .alert-warning {
      background-color: var(--bg-warning-light);
      color: var(--color-warning);
      border: 1px solid #FFCCBC;
    }

    .alert-icon {
      font-size: 13px;
      line-height: 1;
    }
  `]
})
export class BudgetTrackerComponent {
  @Input() id?: string;
  @Input() budget?: BudgetData;

  // Discrete inputs when not passing a single BudgetData object
  @Input() _id?: string;
  @Input() title?: string;
  @Input() period?: 'daily' | 'weekly' | 'monthly' | 'category' | string;
  @Input() categoryName?: string;
  @Input() limitAmount?: number;
  @Input() spentAmount?: number;
  @Input() remainingAmount?: number;
  @Input() utilizationPercentage?: number;
  @Input() status?: 'NORMAL' | 'WARNING' | 'EXCEEDED' | string;
  @Input() currencySymbol: string = '₹';
  @Input() compact: boolean = false;
  @Input() showDelete: boolean = true;

  @Output() delete = new EventEmitter<string>();

  get calculatedSpent(): number {
    if (this.budget && this.budget.spentAmount !== undefined) {
      return Number(this.budget.spentAmount);
    }
    return Number(this.spentAmount || 0);
  }

  get calculatedLimit(): number {
    if (this.budget && this.budget.limitAmount !== undefined) {
      return Number(this.budget.limitAmount);
    }
    return Number(this.limitAmount || 0);
  }

  get percentage(): number {
    if (this.budget && this.budget.utilizationPercentage !== undefined) {
      return Math.round(this.budget.utilizationPercentage);
    }
    if (this.utilizationPercentage !== undefined) {
      return Math.round(this.utilizationPercentage);
    }
    const limit = this.calculatedLimit;
    if (limit <= 0) return 0;
    return Math.round((this.calculatedSpent / limit) * 100);
  }

  get fillWidth(): number {
    const pct = this.percentage;
    if (pct < 0) return 0;
    if (pct > 100) return 100;
    return pct;
  }

  get remaining(): number {
    if (this.budget && this.budget.remainingAmount !== undefined) {
      return Math.max(0, this.budget.remainingAmount);
    }
    if (this.remainingAmount !== undefined) {
      return Math.max(0, this.remainingAmount);
    }
    return Math.max(0, this.calculatedLimit - this.calculatedSpent);
  }

  get excessAmount(): number {
    return Math.max(0, this.calculatedSpent - this.calculatedLimit);
  }

  get statusClass(): 'NORMAL' | 'WARNING' | 'EXCEEDED' {
    const explicitStatus = this.budget?.status || this.status;
    if (explicitStatus === 'EXCEEDED' || explicitStatus === 'WARNING' || explicitStatus === 'NORMAL') {
      return explicitStatus;
    }
    const pct = this.percentage;
    if (pct >= 100) return 'EXCEEDED';
    if (pct >= 80) return 'WARNING';
    return 'NORMAL';
  }

  get displayTitle(): string {
    if (this.title) return this.title;
    const p = (this.budget?.period || this.period || 'Budget').toUpperCase();
    const cat = this.budget?.categoryName || this.categoryName;
    return cat ? `${p} • ${cat}` : `${p} Budget`;
  }

  get displaySubtitle(): string {
    const cat = this.budget?.categoryName || this.categoryName;
    const p = this.budget?.period || this.period;
    if (p === 'category') return '';
    return cat || '';
  }

  onDelete(): void {
    const targetId = this.budget?._id || this._id || '';
    this.delete.emit(targetId);
  }
}
