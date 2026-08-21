import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="budgets-page">
      <div class="header-flex">
        <div>
          <h1 class="page-title">Budget Management</h1>
          <p class="page-subtitle">Real-time budget utilization calculated directly from transaction records.</p>
        </div>
        <button (click)="openSetBudgetModal()" class="btn btn-primary">
          + Set New Budget
        </button>
      </div>

      <!-- Budget Cards Grid -->
      <div *ngIf="loading()" class="p-4 text-center">Loading budgets...</div>

      <div *ngIf="!loading() && budgets().length === 0" class="empty-state kp-card">
        <h3>No budgets created yet</h3>
        <p>Set a daily, weekly, monthly, or category budget to start controlling your spending.</p>
        <button (click)="openSetBudgetModal()" class="btn btn-primary btn-sm">Create your first budget</button>
      </div>

      <div *ngIf="!loading() && budgets().length > 0" class="budgets-grid">
        <div *ngFor="let b of budgets()" class="budget-card kp-card">
          <div class="bc-header">
            <div>
              <span class="badge" [class.badge-coming-soon]="b.period === 'category'">
                {{ b.period | uppercase }} {{ b.categoryName ? '• ' + b.categoryName : '' }}
              </span>
            </div>
            <button (click)="deleteBudget(b._id)" class="delete-btn" title="Delete Budget">&times;</button>
          </div>

          <div class="bc-amount-row">
            <span class="spent-val">₹{{ b.spentAmount | number:'1.2-2' }}</span>
            <span class="limit-val">/ ₹{{ b.limitAmount | number:'1.0-0' }}</span>
          </div>

          <!-- Progress Bar -->
          <div class="progress-bar-bg">
            <div 
              class="progress-bar-fill" 
              [style.width.%]="b.utilizationPercentage > 100 ? 100 : b.utilizationPercentage"
              [class.fill-normal]="b.status === 'NORMAL'"
              [class.fill-warning]="b.status === 'WARNING'"
              [class.fill-exceeded]="b.status === 'EXCEEDED'"
            ></div>
          </div>

          <div class="bc-footer">
            <span class="status-badge" 
              [class.status-normal]="b.status === 'NORMAL'"
              [class.status-warning]="b.status === 'WARNING'"
              [class.status-exceeded]="b.status === 'EXCEEDED'"
            >
              {{ b.status }} ({{ b.utilizationPercentage }}%)
            </span>
            <span class="rem-text">₹{{ b.remainingAmount | number:'1.2-2' }} remaining</span>
          </div>
        </div>
      </div>

      <!-- Set Budget Modal -->
      <div *ngIf="showModal()" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h2>Set Budget Limit</h2>
            <button (click)="closeModal()" class="close-btn">&times;</button>
          </div>

          <form (ngSubmit)="saveBudget()">
            <div class="form-group">
              <label class="form-label">Budget Period</label>
              <select [(ngModel)]="formData.period" name="period" class="form-control" required>
                <option value="monthly">Monthly Budget</option>
                <option value="weekly">Weekly Budget</option>
                <option value="daily">Daily Budget</option>
                <option value="category">Category-Specific Budget</option>
              </select>
            </div>

            <div *ngIf="formData.period === 'category'" class="form-group">
              <label class="form-label">Select Category</label>
              <select [(ngModel)]="formData.categoryId" name="categoryId" class="form-control" required>
                <option *ngFor="let c of expenseCategories()" [value]="c._id">{{ c.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Limit Amount (₹)</label>
              <input type="number" [(ngModel)]="formData.limitAmount" name="limitAmount" class="form-control" placeholder="e.g. 5000" required min="1">
            </div>

            <div class="modal-footer">
              <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Budget</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .budgets-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .header-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .budgets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .budget-card {
      display: flex;
      flex-direction: column;
      gap: 14px;
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
      color: var(--text-muted);
      cursor: pointer;
    }

    .delete-btn:hover { color: var(--color-expense); }

    .bc-amount-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .spent-val { font-size: 24px; font-weight: 700; }
    .limit-val { font-size: 14px; color: var(--text-secondary); }

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

    .status-normal { background-color: var(--bg-income-light); color: var(--color-income); }
    .status-warning { background-color: var(--bg-warning-light); color: var(--color-warning); }
    .status-exceeded { background-color: var(--bg-expense-light); color: var(--color-expense); }

    .rem-text { color: var(--text-secondary); font-weight: 500; }

    .empty-state {
      text-align: center;
      padding: 48px 20px;
    }

    .empty-state h3 { margin-bottom: 6px; }
    .empty-state p { font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
  `]
})
export class BudgetsComponent implements OnInit {
  private api = inject(ApiService);

  budgets = signal<any[]>([]);
  categories = signal<any[]>([]);
  loading = signal(true);
  showModal = signal(false);

  formData: any = {
    period: 'monthly',
    categoryId: '',
    limitAmount: null
  };

  ngOnInit() {
    this.loadCategories();
    this.loadBudgets();
  }

  loadCategories() {
    this.api.get<{ success: boolean; categories: any[] }>('categories').subscribe({
      next: (res) => { if (res.success) this.categories.set(res.categories); }
    });
  }

  loadBudgets() {
    this.loading.set(true);
    this.api.get<{ success: boolean; budgets: any[] }>('budgets').subscribe({
      next: (res) => {
        if (res.success) this.budgets.set(res.budgets);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  expenseCategories() {
    return this.categories().filter(c => c.type === 'expense');
  }

  openSetBudgetModal() {
    this.formData = {
      period: 'monthly',
      categoryId: this.expenseCategories().length > 0 ? this.expenseCategories()[0]._id : '',
      limitAmount: null
    };
    this.showModal.set(true);
  }

  saveBudget() {
    this.api.post('budgets', this.formData).subscribe({
      next: () => {
        this.closeModal();
        this.loadBudgets();
      }
    });
  }

  deleteBudget(id: string) {
    if (confirm('Delete this budget setting?')) {
      this.api.delete(`budgets/${id}`).subscribe({
        next: () => this.loadBudgets()
      });
    }
  }

  closeModal() {
    this.showModal.set(false);
  }
}
