import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-recurring',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="recurring-page">
      <div class="header-flex">
        <div>
          <h1 class="page-title">Recurring Payments & Subscriptions</h1>
          <p class="page-subtitle">Manage fixed subscriptions with upcoming payment alerts and monthly totals.</p>
        </div>
        <button (click)="openAddModal()" class="btn btn-primary">
          + Add Subscription
        </button>
      </div>

      <!-- Monthly Commitment Summary Card -->
      <div class="commitment-card kp-card">
        <div class="cc-left">
          <span class="cc-label">Total Monthly Recurring Commitment</span>
          <div class="cc-value">₹{{ totalMonthlyCommitment() | number:'1.2-2' }}</div>
        </div>
        <span class="badge badge-warning">Definitions separate from transactions</span>
      </div>

      <!-- Subscriptions Table -->
      <div class="kp-card table-card">
        <div *ngIf="loading()" class="p-4 text-center">Loading recurring subscriptions...</div>

        <div *ngIf="!loading() && recurringItems().length === 0" class="empty-state">
          <p class="empty-title">No recurring subscriptions added</p>
          <p class="empty-desc">Track Spotify, Gym, Mobile recharge, Internet, and Cloud storage bills.</p>
          <button (click)="openAddModal()" class="btn btn-primary btn-sm">Add Subscription</button>
        </div>

        <div *ngIf="!loading() && recurringItems().length > 0" class="table-responsive">
          <table class="kp-table">
            <thead>
              <tr>
                <th>Subscription</th>
                <th>Category</th>
                <th>Frequency</th>
                <th>Next Payment Date</th>
                <th>Status</th>
                <th class="text-right">Amount</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of recurringItems()">
                <td class="font-bold">{{ item.name }}</td>
                <td><span class="badge badge-coming-soon">{{ item.categoryName }}</span></td>
                <td>{{ item.frequency | titlecase }}</td>
                <td>{{ item.nextDueDate | date:'mediumDate' }}</td>
                <td>
                  <span class="status-chip" [class.chip-active]="item.isActive" [class.chip-inactive]="!item.isActive">
                    {{ item.isActive ? 'Active' : 'Paused' }}
                  </span>
                </td>
                <td class="text-right font-bold text-peach">−₹{{ item.amount | number:'1.2-2' }}</td>
                <td class="text-right">
                  <button (click)="deleteItem(item._id)" class="action-btn text-danger" title="Delete">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Subscription Modal -->
      <div *ngIf="showModal()" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h2>Add Recurring Subscription</h2>
            <button (click)="closeModal()" class="close-btn">&times;</button>
          </div>

          <form (ngSubmit)="saveItem()">
            <div class="form-group">
              <label class="form-label">Subscription Name</label>
              <input type="text" [(ngModel)]="formData.name" name="name" class="form-control" placeholder="e.g. Spotify, Gym, Mobile" required>
            </div>

            <div class="form-group">
              <label class="form-label">Amount (₹)</label>
              <input type="number" [(ngModel)]="formData.amount" name="amount" class="form-control" placeholder="649" required min="1">
            </div>

            <div class="form-group">
              <label class="form-label">Frequency</label>
              <select [(ngModel)]="formData.frequency" name="frequency" class="form-control" required>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Next Payment Due Date</label>
              <input type="date" [(ngModel)]="formData.nextDueDate" name="nextDueDate" class="form-control" required>
            </div>

            <div class="modal-footer">
              <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Subscription</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .recurring-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .header-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .commitment-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-left: 4px solid var(--pastel-yellow);
    }

    .cc-label { font-size: 13px; color: var(--text-secondary); }
    .cc-value { font-size: 26px; font-weight: 700; margin-top: 2px; }

    .table-card { padding: 0; overflow: hidden; }
    .font-bold { font-weight: 600; }
    .text-peach { color: #C62828; }
    .text-right { text-align: right; }

    .status-chip { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 12px; }
    .chip-active { background-color: #E8F5E9; color: #2E7D32; }
    .chip-inactive { background-color: #ECEFF1; color: var(--text-muted); }

    .action-btn { background: none; border: none; font-size: 12px; font-weight: 600; cursor: pointer; }
    .action-btn.text-danger:hover { color: var(--color-expense); }

    .empty-state { text-align: center; padding: 48px 20px; }
    .empty-title { font-weight: 600; font-size: 16px; margin-bottom: 4px; }
    .empty-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; }

    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
  `]
})
export class RecurringComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  recurringItems = signal<any[]>([]);
  totalMonthlyCommitment = signal(0);
  showModal = signal(false);

  formData: any = {
    name: '',
    amount: null,
    frequency: 'monthly',
    nextDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
  };

  ngOnInit() {
    this.loadRecurring();
  }

  loadRecurring() {
    this.loading.set(true);
    this.api.get<{ success: boolean; totalMonthlyCommitment: number; recurringExpenses: any[] }>('recurring-expenses').subscribe({
      next: (res) => {
        if (res.success) {
          this.totalMonthlyCommitment.set(res.totalMonthlyCommitment);
          this.recurringItems.set(res.recurringExpenses);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openAddModal() {
    this.formData = {
      name: '',
      amount: null,
      frequency: 'monthly',
      nextDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
    };
    this.showModal.set(true);
  }

  saveItem() {
    this.api.post('recurring-expenses', this.formData).subscribe({
      next: () => {
        this.closeModal();
        this.loadRecurring();
      }
    });
  }

  deleteItem(id: string) {
    if (confirm('Delete this recurring subscription?')) {
      this.api.delete(`recurring-expenses/${id}`).subscribe({
        next: () => this.loadRecurring()
      });
    }
  }

  closeModal() {
    this.showModal.set(false);
  }
}
