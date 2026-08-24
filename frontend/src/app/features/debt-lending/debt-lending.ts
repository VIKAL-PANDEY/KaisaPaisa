import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-debt-lending',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="debt-page">
      <div class="header-flex">
        <div>
          <h1 class="page-title">Debt & Lending</h1>
          <p class="page-subtitle">Track informal money lent and borrowed with due dates and net balance.</p>
        </div>
        <button (click)="openAddModal()" class="btn btn-primary">
          + Record Debt / Lending
        </button>
      </div>

      <!-- Summary Stats -->
      <div class="summary-grid">
        <div class="stat-card kp-card border-sage">
          <span class="stat-label">Money Owed to Me</span>
          <div class="stat-value text-sage">₹{{ summary()?.moneyOwedToMe | number:'1.2-2' }}</div>
          <span class="stat-subtext">Lent to friends & colleagues</span>
        </div>

        <div class="stat-card kp-card border-peach">
          <span class="stat-label">Money I Owe</span>
          <div class="stat-value text-peach">₹{{ summary()?.moneyIOwe | number:'1.2-2' }}</div>
          <span class="stat-subtext">Borrowed from others</span>
        </div>

        <div class="stat-card kp-card border-blue">
          <span class="stat-label">Net Position</span>
          <div class="stat-value" [class.text-sage]="summary()?.netPosition >= 0" [class.text-peach]="summary()?.netPosition < 0">
            {{ summary()?.netPosition >= 0 ? '+' : '' }}₹{{ summary()?.netPosition | number:'1.2-2' }}
          </div>
          <span class="stat-subtext">Owed to me minus money I owe</span>
        </div>
      </div>

      <!-- Debts List -->
      <div class="kp-card table-card">
        <div *ngIf="loading()" class="p-4 text-center">Loading records...</div>

        <div *ngIf="!loading() && debts().length === 0" class="empty-state">
          <p class="empty-title">No debt or lending records found</p>
          <p class="empty-desc">Keep track of money lent to friends or borrowed for shared expenses.</p>
          <button (click)="openAddModal()" class="btn btn-primary btn-sm">Add Record</button>
        </div>

        <div *ngIf="!loading() && debts().length > 0" class="table-responsive">
          <table class="kp-table">
            <thead>
              <tr>
                <th>Person</th>
                <th>Type</th>
                <th>Due Date</th>
                <th>Description</th>
                <th>Status</th>
                <th class="text-right">Amount</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of debts()">
                <td class="font-bold">{{ d.personName }}</td>
                <td>
                  <span class="badge" [class.badge-income]="d.direction === 'LENT'" [class.badge-expense]="d.direction === 'BORROWED'">
                    {{ d.direction === 'LENT' ? 'Rahul / Friend Owes You' : 'You Owe Friend' }}
                  </span>
                </td>
                <td>{{ d.dueDate | date:'mediumDate' }}</td>
                <td class="text-muted">{{ d.description || '—' }}</td>
                <td>
                  <span class="status-chip" 
                    [class.chip-pending]="d.status === 'PENDING'"
                    [class.chip-paid]="d.status === 'PAID'"
                    [class.chip-overdue]="d.status === 'OVERDUE'"
                  >
                    {{ d.status }}
                  </span>
                </td>
                <td class="text-right font-bold" [class.text-sage]="d.direction === 'LENT'" [class.text-peach]="d.direction === 'BORROWED'">
                  {{ d.direction === 'LENT' ? '+' : '−' }}₹{{ d.amount | number:'1.2-2' }}
                </td>
                <td class="text-right">
                  <button *ngIf="d.status !== 'PAID'" (click)="markAsPaid(d._id)" class="action-btn text-sage" title="Mark Paid">Mark Paid</button>
                  <button (click)="deleteDebt(d._id)" class="action-btn text-danger" title="Delete">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Debt Modal -->
      <div *ngIf="showModal()" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h2>Record Debt / Lending</h2>
            <button (click)="closeModal()" class="close-btn">&times;</button>
          </div>

          <form (ngSubmit)="saveDebt()">
            <div class="form-group">
              <label class="form-label">Person Name</label>
              <input type="text" [(ngModel)]="formData.personName" name="personName" class="form-control" placeholder="e.g. Rahul Verma" required>
            </div>

            <div class="form-group">
              <label class="form-label">Direction</label>
              <select [(ngModel)]="formData.direction" name="direction" class="form-control" required>
                <option value="LENT">I Lent Money (They owe me)</option>
                <option value="BORROWED">I Borrowed Money (I owe them)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Amount (₹)</label>
              <input type="number" [(ngModel)]="formData.amount" name="amount" class="form-control" placeholder="750" required min="1">
            </div>

            <div class="form-group">
              <label class="form-label">Due Date</label>
              <input type="date" [(ngModel)]="formData.dueDate" name="dueDate" class="form-control" required>
            </div>

            <div class="form-group">
              <label class="form-label">Description (Optional)</label>
              <input type="text" [(ngModel)]="formData.description" name="description" class="form-control" placeholder="Lunch bill split, printouts...">
            </div>

            <div class="modal-footer">
              <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Record</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .debt-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .header-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .stat-label { font-size: 12.5px; color: var(--text-secondary); }
    .stat-value { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 6px 0; }
    .stat-subtext { font-size: 12px; color: var(--text-muted); }

    .border-sage { border-left: 4px solid var(--color-soft-blue); }
    .border-peach { border-left: 4px solid var(--color-expense); }
    .border-blue { border-left: 4px solid var(--color-primary); }

    .text-sage { color: var(--color-soft-blue); }
    .text-peach { color: var(--color-expense); }
    .font-bold { font-weight: 600; color: var(--text-primary); }
    .text-right { text-align: right; }
    .text-muted { color: var(--text-secondary); font-size: 13px; }

    .status-chip {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 12px;
    }

    .chip-pending { background-color: var(--bg-warning-light); color: var(--color-warning); border: 1px solid rgba(255, 183, 77, 0.2); }
    .chip-paid { background-color: var(--bg-income-light); color: var(--color-income); border: 1px solid rgba(151, 185, 255, 0.2); }
    .chip-overdue { background-color: var(--bg-expense-light); color: var(--color-expense); border: 1px solid rgba(229, 115, 115, 0.2); }

    .action-btn {
      background: none;
      border: none;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      margin-left: 8px;
    }

    .table-card { padding: 0; overflow: hidden; }
    .empty-state { text-align: center; padding: 48px 20px; }
    .empty-title { font-weight: 600; font-size: 16px; margin-bottom: 4px; }
    .empty-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; }

    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
  `]
})
export class DebtLendingComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  debts = signal<any[]>([]);
  summary = signal<any>(null);
  showModal = signal(false);

  formData: any = {
    personName: '',
    direction: 'LENT',
    amount: null,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
    description: ''
  };

  ngOnInit() {
    this.loadDebts();
  }

  loadDebts() {
    this.loading.set(true);
    this.api.get<{ success: boolean; summary: any; debts: any[] }>('debts').subscribe({
      next: (res) => {
        if (res.success) {
          this.summary.set(res.summary);
          this.debts.set(res.debts);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openAddModal() {
    this.formData = {
      personName: '',
      direction: 'LENT',
      amount: null,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      description: ''
    };
    this.showModal.set(true);
  }

  saveDebt() {
    this.api.post('debts', this.formData).subscribe({
      next: () => {
        this.closeModal();
        this.loadDebts();
      }
    });
  }

  markAsPaid(id: string) {
    this.api.put(`debts/${id}/status`, { status: 'PAID' }).subscribe({
      next: () => this.loadDebts()
    });
  }

  deleteDebt(id: string) {
    if (confirm('Delete this record?')) {
      this.api.delete(`debts/${id}`).subscribe({
        next: () => this.loadDebts()
      });
    }
  }

  closeModal() {
    this.showModal.set(false);
  }
}
