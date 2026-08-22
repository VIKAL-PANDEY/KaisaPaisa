import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { BudgetTrackerComponent } from '../../shared/components/budget-tracker/budget-tracker';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, FormsModule, BudgetTrackerComponent],
  template: `
    <div class="budgets-page" id="budgets-management-page">
      <div class="header-flex">
        <div>
          <h1 class="page-title">Budget Management</h1>
          <p class="page-subtitle">Real-time budget utilization calculated directly from transaction records.</p>
        </div>
        <button (click)="openSetBudgetModal()" class="btn btn-primary" id="set-budget-btn">
          + Set New Budget
        </button>
      </div>

      <!-- Budget Cards Grid -->
      <div *ngIf="loading()" class="p-4 text-center">Loading budgets...</div>

      <div *ngIf="!loading() && budgets().length === 0" class="empty-state kp-card" id="empty-budgets-card">
        <h3>No budgets created yet</h3>
        <p>Set a daily, weekly, monthly, or category budget to start controlling your spending.</p>
        <button (click)="openSetBudgetModal()" class="btn btn-primary btn-sm">Create your first budget</button>
      </div>

      <div *ngIf="!loading() && budgets().length > 0" class="budgets-grid" id="budgets-list-grid">
        <app-budget-tracker
          *ngFor="let b of budgets()"
          [budget]="b"
          [showDelete]="true"
          (delete)="deleteBudget($event)"
        ></app-budget-tracker>
      </div>

      <!-- Set Budget Modal -->
      <div *ngIf="showModal()" class="modal-overlay" id="set-budget-modal-overlay">
        <div class="modal-card" id="set-budget-modal-card">
          <div class="modal-header">
            <h2>Set Budget Limit</h2>
            <button (click)="closeModal()" class="close-btn" aria-label="Close modal">&times;</button>
          </div>

          <form (ngSubmit)="saveBudget()" id="set-budget-form">
            <div class="form-group">
              <label class="form-label" for="budget-period-select">Budget Period</label>
              <select id="budget-period-select" [(ngModel)]="formData.period" name="period" class="form-control" required>
                <option value="monthly">Monthly Budget</option>
                <option value="weekly">Weekly Budget</option>
                <option value="daily">Daily Budget</option>
                <option value="category">Category-Specific Budget</option>
              </select>
            </div>

            <div *ngIf="formData.period === 'category'" class="form-group">
              <label class="form-label" for="budget-category-select">Select Category</label>
              <select id="budget-category-select" [(ngModel)]="formData.categoryId" name="categoryId" class="form-control" required>
                <option *ngFor="let c of expenseCategories()" [value]="c._id">{{ c.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="budget-limit-amount-input">Limit Amount (₹)</label>
              <input id="budget-limit-amount-input" type="number" [(ngModel)]="formData.limitAmount" name="limitAmount" class="form-control" placeholder="e.g. 5000" required min="1">
            </div>

            <div class="modal-footer">
              <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary" id="submit-save-budget-btn">Save Budget</button>
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
