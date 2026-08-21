import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-savings-goals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="goals-page">
      <div class="header-flex">
        <div>
          <h1 class="page-title">Savings Goals</h1>
          <p class="page-subtitle">Set goals, track progress, and calculate required monthly savings.</p>
        </div>
        <button (click)="openAddModal()" class="btn btn-primary">
          + Set Savings Goal
        </button>
      </div>

      <div *ngIf="loading()" class="p-4 text-center">Loading savings goals...</div>

      <div *ngIf="!loading() && goals().length === 0" class="empty-state kp-card">
        <h3>Set your first savings goal</h3>
        <p>Whether for an Emergency Fund, New Laptop, or Travel, track your progress step-by-step.</p>
        <button (click)="openAddModal()" class="btn btn-primary btn-sm">Create Goal</button>
      </div>

      <div *ngIf="!loading() && goals().length > 0" class="goals-grid">
        <div *ngFor="let g of goals()" class="goal-card kp-card">
          <div class="gc-header">
            <h3 class="gc-title">{{ g.goalName }}</h3>
            <button (click)="deleteGoal(g._id)" class="delete-btn" title="Delete Goal">&times;</button>
          </div>

          <p class="gc-desc" *ngIf="g.description">{{ g.description }}</p>

          <div class="gc-amounts">
            <span class="curr-val">₹{{ g.currentAmount | number:'1.0-0' }}</span>
            <span class="target-val">of ₹{{ g.targetAmount | number:'1.0-0' }}</span>
          </div>

          <!-- Progress Bar -->
          <div class="progress-bar-bg">
            <div class="progress-bar-fill fill-normal" [style.width.%]="g.progressPercentage"></div>
          </div>

          <div class="gc-meta">
            <span class="pct-badge">{{ g.progressPercentage }}% Complete</span>
            <span class="rem-text">₹{{ g.remainingAmount | number:'1.0-0' }} remaining</span>
          </div>

          <div class="req-savings-box">
            <span class="req-label">Required Monthly Savings</span>
            <span class="req-val">₹{{ g.requiredMonthlySavings | number:'1.0-0' }}/month</span>
            <span class="req-sub">Target: {{ g.targetDate | date:'mediumDate' }} ({{ g.monthsRemaining }} months left)</span>
          </div>

          <div class="gc-actions">
            <button (click)="openAddFundsModal(g)" class="btn btn-secondary btn-sm flex-1">+ Add Funds</button>
          </div>
        </div>
      </div>

      <!-- Create / Update Goal Modal -->
      <div *ngIf="showModal()" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h2>{{ isUpdatingFunds() ? 'Add Funds to Goal' : 'Create Savings Goal' }}</h2>
            <button (click)="closeModal()" class="close-btn">&times;</button>
          </div>

          <form (ngSubmit)="saveGoal()">
            <div *ngIf="!isUpdatingFunds()">
              <div class="form-group">
                <label class="form-label">Goal Name</label>
                <input type="text" [(ngModel)]="formData.goalName" name="goalName" class="form-control" placeholder="e.g. Emergency Fund, New Laptop" required>
              </div>

              <div class="form-group">
                <label class="form-label">Target Amount (₹)</label>
                <input type="number" [(ngModel)]="formData.targetAmount" name="targetAmount" class="form-control" placeholder="10000" required min="1">
              </div>

              <div class="form-group">
                <label class="form-label">Already Saved Amount (₹)</label>
                <input type="number" [(ngModel)]="formData.currentAmount" name="currentAmount" class="form-control" placeholder="0">
              </div>

              <div class="form-group">
                <label class="form-label">Target Date</label>
                <input type="date" [(ngModel)]="formData.targetDate" name="targetDate" class="form-control" required>
              </div>

              <div class="form-group">
                <label class="form-label">Description (Optional)</label>
                <input type="text" [(ngModel)]="formData.description" name="description" class="form-control" placeholder="Short description...">
              </div>
            </div>

            <!-- Quick Add Funds Mode -->
            <div *ngIf="isUpdatingFunds()">
              <div class="form-group">
                <label class="form-label">Goal: {{ activeGoal?.goalName }}</label>
                <div class="text-muted mb-2">Current Saved: ₹{{ activeGoal?.currentAmount }} / ₹{{ activeGoal?.targetAmount }}</div>
              </div>

              <div class="form-group">
                <label class="form-label">Add Amount (₹)</label>
                <input type="number" [(ngModel)]="addFundsAmount" name="addFundsAmount" class="form-control" placeholder="500" required min="1">
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Goal</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .goals-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .header-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .goals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
    }

    .goal-card {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .gc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .gc-title { font-size: 17px; font-weight: 700; }
    .delete-btn { background: none; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer; }
    .delete-btn:hover { color: var(--color-expense); }

    .gc-desc { font-size: 13px; color: var(--text-secondary); }

    .gc-amounts { display: flex; align-items: baseline; gap: 6px; }
    .curr-val { font-size: 24px; font-weight: 700; color: #2E7D32; }
    .target-val { font-size: 14px; color: var(--text-secondary); }

    .gc-meta { display: flex; align-items: center; justify-content: space-between; font-size: 12.5px; }
    .pct-badge { font-weight: 700; color: var(--text-primary); background-color: #EDE7F6; padding: 2px 8px; border-radius: 10px; }
    .rem-text { color: var(--text-secondary); }

    .req-savings-box {
      background-color: var(--surface-secondary);
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .req-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
    .req-val { font-size: 16px; font-weight: 700; color: var(--text-primary); }
    .req-sub { font-size: 11px; color: var(--text-secondary); }

    .gc-actions { display: flex; gap: 10px; margin-top: 4px; }
    .flex-1 { flex: 1; }

    .empty-state { text-align: center; padding: 48px 20px; }
    .empty-state h3 { margin-bottom: 6px; }
    .empty-state p { font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; }

    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
    .mb-2 { margin-bottom: 8px; }
    .text-muted { font-size: 13px; color: var(--text-secondary); }
  `]
})
export class SavingsGoalsComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  goals = signal<any[]>([]);
  showModal = signal(false);
  isUpdatingFunds = signal(false);
  activeGoal: any = null;
  addFundsAmount = null;

  formData: any = {
    goalName: '',
    targetAmount: null,
    currentAmount: 0,
    targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
    description: ''
  };

  ngOnInit() {
    this.loadGoals();
  }

  loadGoals() {
    this.loading.set(true);
    this.api.get<{ success: boolean; goals: any[] }>('goals').subscribe({
      next: (res) => {
        if (res.success) this.goals.set(res.goals);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openAddModal() {
    this.isUpdatingFunds.set(false);
    this.formData = {
      goalName: '',
      targetAmount: null,
      currentAmount: 0,
      targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      description: ''
    };
    this.showModal.set(true);
  }

  openAddFundsModal(g: any) {
    this.activeGoal = g;
    this.addFundsAmount = null;
    this.isUpdatingFunds.set(true);
    this.showModal.set(true);
  }

  saveGoal() {
    if (this.isUpdatingFunds() && this.activeGoal) {
      const newAmount = (this.activeGoal.currentAmount || 0) + (Number(this.addFundsAmount) || 0);
      this.api.put(`goals/${this.activeGoal._id}`, { currentAmount: newAmount }).subscribe({
        next: () => {
          this.closeModal();
          this.loadGoals();
        }
      });
    } else {
      this.api.post('goals', this.formData).subscribe({
        next: () => {
          this.closeModal();
          this.loadGoals();
        }
      });
    }
  }

  deleteGoal(id: string) {
    if (confirm('Delete this savings goal?')) {
      this.api.delete(`goals/${id}`).subscribe({
        next: () => this.loadGoals()
      });
    }
  }

  closeModal() {
    this.showModal.set(false);
  }
}
