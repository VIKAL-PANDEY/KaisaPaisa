import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="transactions-page">
      <div class="header-flex">
        <div>
          <h1 class="page-title">Transactions</h1>
          <p class="page-subtitle">Track every income and expense transaction in real time.</p>
        </div>
        <button (click)="openAddModal()" class="btn btn-primary">
          + Add Transaction
        </button>
      </div>

      <!-- Filters Bar -->
      <div class="filters-card kp-card">
        <div class="filter-row">
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="onFilterChange()" 
            placeholder="Search merchant, description..." 
            class="form-control filter-search"
          >

          <select [(ngModel)]="selectedType" (change)="onFilterChange()" class="form-control filter-select">
            <option value="">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
          </select>

          <select [(ngModel)]="selectedCategory" (change)="onFilterChange()" class="form-control filter-select">
            <option value="">All Categories</option>
            <option *ngFor="let c of categories()" [value]="c._id">{{ c.name }}</option>
          </select>

          <select [(ngModel)]="selectedAccount" (change)="onFilterChange()" class="form-control filter-select">
            <option value="">All Accounts</option>
            <option *ngFor="let a of accounts()" [value]="a._id">{{ a.name }}</option>
          </select>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="kp-card table-card">
        <div *ngIf="loading()" class="p-4 text-center">Loading transactions...</div>

        <div *ngIf="!loading() && transactions().length === 0" class="empty-state">
          <p class="empty-title">No transactions found</p>
          <p class="empty-desc">Add your first transaction to start tracking your money.</p>
          <button (click)="openAddModal()" class="btn btn-primary btn-sm">Add Transaction</button>
        </div>

        <div *ngIf="!loading() && transactions().length > 0" class="table-responsive">
          <table class="kp-table">
            <thead>
              <tr>
                <th>Merchant / Title</th>
                <th>Category</th>
                <th>Account</th>
                <th>Date</th>
                <th>Payment</th>
                <th class="text-right">Amount</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of transactions()">
                <td>
                  <div class="tx-title">{{ t.merchant || t.categoryName }}</div>
                  <div class="tx-desc" *ngIf="t.description">{{ t.description }}</div>
                </td>
                <td>
                  <span class="badge" [class.badge-income]="t.type === 'income'" [class.badge-expense]="t.type === 'expense'">
                    {{ t.categoryName }}
                  </span>
                </td>
                <td>{{ t.accountName }}</td>
                <td>{{ t.date | date:'mediumDate' }}</td>
                <td>{{ t.paymentMethod }}</td>
                <td class="text-right font-bold" [class.text-sage]="t.type === 'income'" [class.text-peach]="t.type === 'expense'">
                  {{ t.type === 'income' ? '+' : '−' }}₹{{ t.amount | number:'1.2-2' }}
                </td>
                <td class="text-right">
                  <button (click)="editTransaction(t)" class="action-btn" title="Edit">Edit</button>
                  <button (click)="deleteTransaction(t._id)" class="action-btn text-danger" title="Delete">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Transaction Modal -->
      <div *ngIf="showModal()" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h2>{{ isEditing() ? 'Edit Transaction' : 'Add Transaction' }}</h2>
            <button (click)="closeModal()" class="close-btn">&times;</button>
          </div>

          <form (ngSubmit)="saveTransaction()">
            <div class="form-group">
              <label class="form-label">Transaction Type</label>
              <div class="type-toggle">
                <button 
                  type="button" 
                  [class.active-type-expense]="formData.type === 'expense'"
                  (click)="formData.type = 'expense'"
                  class="toggle-btn"
                >
                  Expense
                </button>
                <button 
                  type="button" 
                  [class.active-type-income]="formData.type === 'income'"
                  (click)="formData.type = 'income'"
                  class="toggle-btn"
                >
                  Income
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Amount (₹)</label>
              <input type="number" step="0.01" [(ngModel)]="formData.amount" name="amount" class="form-control" placeholder="0.00" required>
            </div>

            <div class="form-group">
              <label class="form-label">Category</label>
              <select [(ngModel)]="formData.categoryId" name="categoryId" class="form-control" required>
                <option *ngFor="let c of filteredCategoriesForModal()" [value]="c._id">{{ c.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Account</label>
              <select [(ngModel)]="formData.accountId" name="accountId" class="form-control">
                <option *ngFor="let a of accounts()" [value]="a._id">{{ a.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Merchant / Payee</label>
              <input type="text" [(ngModel)]="formData.merchant" name="merchant" class="form-control" placeholder="e.g. Swiggy, Netflix, Salary">
            </div>

            <div class="form-row">
              <div class="form-group col">
                <label class="form-label">Date</label>
                <input type="date" [(ngModel)]="formData.date" name="date" class="form-control" required>
              </div>

              <div class="form-group col">
                <label class="form-label">Payment Method</label>
                <select [(ngModel)]="formData.paymentMethod" name="paymentMethod" class="form-control">
                  <option value="UPI">UPI</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Description (Optional)</label>
              <input type="text" [(ngModel)]="formData.description" name="description" class="form-control" placeholder="Additional notes...">
            </div>

            <div class="modal-footer">
              <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary">{{ isEditing() ? 'Update' : 'Add Transaction' }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .transactions-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .header-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .filters-card {
      padding: 16px 20px;
    }

    .filter-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 12px;
    }

    @media (max-width: 768px) {
      .filter-row {
        grid-template-columns: 1fr;
      }
    }

    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .tx-title { font-weight: 600; font-size: 14px; }
    .tx-desc { font-size: 11.5px; color: var(--text-secondary); }
    .font-bold { font-weight: 700; }
    .text-right { text-align: right; }
    .text-sage { color: #2E7D32; }
    .text-peach { color: #C62828; }

    .action-btn {
      background: none;
      border: none;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      margin-left: 8px;
    }

    .action-btn:hover { color: var(--text-primary); }
    .action-btn.text-danger:hover { color: var(--color-expense); }

    .type-toggle {
      display: flex;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-input);
      overflow: hidden;
    }

    .toggle-btn {
      flex: 1;
      padding: 8px;
      border: none;
      background: var(--surface-secondary);
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }

    .active-type-expense { background-color: var(--pastel-peach); color: #C62828; }
    .active-type-income { background-color: var(--pastel-sage); color: #2E7D32; }

    .form-row {
      display: flex;
      gap: 12px;
    }

    .form-group.col { flex: 1; }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--text-secondary);
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
    }

    .empty-state {
      text-align: center;
      padding: 48px 20px;
    }

    .empty-title { font-weight: 600; font-size: 16px; margin-bottom: 4px; }
    .empty-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; }
  `]
})
export class TransactionsComponent implements OnInit {
  private api = inject(ApiService);

  transactions = signal<any[]>([]);
  categories = signal<any[]>([]);
  accounts = signal<any[]>([]);
  loading = signal(true);
  showModal = signal(false);
  isEditing = signal(false);

  searchQuery = '';
  selectedType = '';
  selectedCategory = '';
  selectedAccount = '';

  formData: any = {
    _id: null,
    type: 'expense',
    amount: null,
    categoryId: '',
    accountId: '',
    merchant: '',
    description: '',
    paymentMethod: 'UPI',
    date: new Date().toISOString().substring(0, 10)
  };

  ngOnInit() {
    this.loadCategories();
    this.loadAccounts();
    this.loadTransactions();
  }

  loadCategories() {
    this.api.get<{ success: boolean; categories: any[] }>('categories').subscribe({
      next: (res) => { if (res.success) this.categories.set(res.categories); }
    });
  }

  loadAccounts() {
    this.api.get<{ success: boolean; accounts: any[] }>('accounts').subscribe({
      next: (res) => { if (res.success) this.accounts.set(res.accounts); }
    });
  }

  loadTransactions() {
    this.loading.set(true);
    const params: any = {};
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedType) params.type = this.selectedType;
    if (this.selectedCategory) params.categoryId = this.selectedCategory;
    if (this.selectedAccount) params.accountId = this.selectedAccount;

    this.api.get<{ success: boolean; transactions: any[] }>('transactions', params).subscribe({
      next: (res) => {
        if (res.success) this.transactions.set(res.transactions);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onFilterChange() {
    this.loadTransactions();
  }

  filteredCategoriesForModal() {
    return this.categories().filter(c => c.type === this.formData.type);
  }

  openAddModal() {
    this.isEditing.set(false);
    this.formData = {
      _id: null,
      type: 'expense',
      amount: null,
      categoryId: this.categories().length > 0 ? this.categories()[0]._id : '',
      accountId: this.accounts().length > 0 ? this.accounts()[0]._id : '',
      merchant: '',
      description: '',
      paymentMethod: 'UPI',
      date: new Date().toISOString().substring(0, 10)
    };
    this.showModal.set(true);
  }

  editTransaction(t: any) {
    this.isEditing.set(true);
    this.formData = {
      _id: t._id,
      type: t.type,
      amount: t.amount,
      categoryId: t.categoryId,
      accountId: t.accountId,
      merchant: t.merchant,
      description: t.description,
      paymentMethod: t.paymentMethod,
      date: new Date(t.date).toISOString().substring(0, 10)
    };
    this.showModal.set(true);
  }

  saveTransaction() {
    if (this.isEditing()) {
      this.api.put(`transactions/${this.formData._id}`, this.formData).subscribe({
        next: () => {
          this.closeModal();
          this.loadTransactions();
        }
      });
    } else {
      this.api.post('transactions', this.formData).subscribe({
        next: () => {
          this.closeModal();
          this.loadTransactions();
        }
      });
    }
  }

  deleteTransaction(id: string) {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.api.delete(`transactions/${id}`).subscribe({
        next: () => this.loadTransactions()
      });
    }
  }

  closeModal() {
    this.showModal.set(false);
  }
}
