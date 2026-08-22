import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
          <p class="page-subtitle">Track, filter, and search your income and expense history in real time.</p>
        </div>
        <button id="add-transaction-btn" (click)="openAddModal()" class="btn btn-primary">
          + Add Transaction
        </button>
      </div>

      <!-- Enhanced Search and Filter Bar -->
      <div class="filters-card kp-card">
        <!-- Top Search Bar Row -->
        <div class="search-bar-wrapper">
          <div class="search-input-container">
            <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              id="transaction-search-input"
              type="text" 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="onSearchInput($event)" 
              placeholder="Search by merchant name, category, or note..." 
              class="form-control main-search-input"
            >
            <button 
              *ngIf="searchQuery" 
              (click)="clearSearch()" 
              class="clear-search-btn" 
              type="button"
              title="Clear search"
            >
              &times;
            </button>
          </div>

          <div class="filter-controls-group">
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

        <!-- Quick Category Chips -->
        <div class="category-chips-scroll" *ngIf="categories().length > 0">
          <span class="chips-label">Quick filter:</span>
          <button 
            type="button" 
            class="category-chip" 
            [class.active-chip]="!selectedCategory && !searchQuery" 
            (click)="selectCategoryChip('')"
          >
            All
          </button>
          <button 
            type="button" 
            *ngFor="let cat of categories().slice(0, 8)" 
            class="category-chip" 
            [class.active-chip]="selectedCategory === cat._id" 
            (click)="selectCategoryChip(cat._id)"
          >
            <span class="chip-dot" [style.background-color]="cat.color || '#4A7C59'"></span>
            {{ cat.name }}
          </button>
        </div>

        <!-- Active Filter Indicator & Clear -->
        <div *ngIf="hasActiveFilters()" class="active-filter-summary">
          <div class="summary-text">
            <span>Filtering by:</span>
            <span *ngIf="searchQuery" class="filter-tag">
              Keyword: "<strong>{{ searchQuery }}</strong>"
              <button (click)="clearSearch()" class="remove-tag">&times;</button>
            </span>
            <span *ngIf="selectedCategoryName()" class="filter-tag">
              Category: <strong>{{ selectedCategoryName() }}</strong>
              <button (click)="selectCategoryChip('')" class="remove-tag">&times;</button>
            </span>
            <span *ngIf="selectedType" class="filter-tag">
              Type: <strong>{{ selectedType | titlecase }}</strong>
              <button (click)="selectedType = ''; onFilterChange()" class="remove-tag">&times;</button>
            </span>
            <span *ngIf="selectedAccountName()" class="filter-tag">
              Account: <strong>{{ selectedAccountName() }}</strong>
              <button (click)="selectedAccount = ''; onFilterChange()" class="remove-tag">&times;</button>
            </span>
          </div>
          <button (click)="resetAllFilters()" class="btn-clear-all" type="button">
            Reset Filters
          </button>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="kp-card table-card">
        <div *ngIf="loading()" class="p-4 text-center">
          <div class="loading-spinner"></div>
          <p style="margin-top: 8px; color: var(--text-secondary); font-size: 13px;">Loading transactions...</p>
        </div>

        <div *ngIf="!loading() && transactions().length === 0" class="empty-state">
          <div *ngIf="hasActiveFilters(); else noDataAtAll">
            <svg class="empty-icon" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
            <p class="empty-title">No transactions match your search</p>
            <p class="empty-desc">We couldn't find any transactions matching your active filters or search terms.</p>
            <button (click)="resetAllFilters()" class="btn btn-secondary btn-sm">Clear Filters</button>
          </div>
          <ng-template #noDataAtAll>
            <p class="empty-title">No transactions found</p>
            <p class="empty-desc">Add your first transaction to start tracking your money.</p>
            <button (click)="openAddModal()" class="btn btn-primary btn-sm">+ Add Transaction</button>
          </ng-template>
        </div>

        <div *ngIf="!loading() && transactions().length > 0" class="table-responsive">
          <div class="results-header">
            <span>Showing {{ transactions().length }} {{ transactions().length === 1 ? 'transaction' : 'transactions' }}</span>
          </div>
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
      gap: 16px;
    }

    .filters-card {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .search-bar-wrapper {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }

    .search-input-container {
      position: relative;
      flex: 1;
      min-width: 240px;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      color: var(--text-secondary);
      pointer-events: none;
    }

    .main-search-input {
      width: 100%;
      padding-left: 38px;
      padding-right: 36px;
      height: 42px;
      font-size: 14px;
      border-radius: var(--radius-input);
      transition: all 0.2s ease;
    }

    .main-search-input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(74, 124, 89, 0.15);
    }

    .clear-search-btn {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 18px;
      cursor: pointer;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .clear-search-btn:hover {
      background-color: var(--surface-secondary);
      color: var(--text-primary);
    }

    .filter-controls-group {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .filter-select {
      height: 42px;
      font-size: 13.5px;
      min-width: 130px;
    }

    .category-chips-scroll {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 2px;
      scrollbar-width: thin;
    }

    .chips-label {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
      white-space: nowrap;
      margin-right: 4px;
    }

    .category-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: var(--surface-secondary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .category-chip:hover {
      background: var(--border-color);
      color: var(--text-primary);
    }

    .category-chip.active-chip {
      background: #E8F0EB;
      border-color: #4A7C59;
      color: #2D5A3C;
      font-weight: 600;
    }

    .chip-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }

    .active-filter-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      padding-top: 10px;
      border-top: 1px dashed var(--border-color);
      font-size: 12px;
    }

    .summary-text {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      color: var(--text-secondary);
    }

    .filter-tag {
      background: var(--surface-secondary);
      border: 1px solid var(--border-color);
      padding: 3px 8px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--text-primary);
    }

    .remove-tag {
      background: none;
      border: none;
      font-size: 14px;
      line-height: 1;
      cursor: pointer;
      color: var(--text-secondary);
      padding: 0;
    }

    .remove-tag:hover {
      color: var(--color-expense);
    }

    .btn-clear-all {
      background: none;
      border: none;
      color: #4A7C59;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      text-decoration: underline;
      padding: 2px 6px;
    }

    .results-header {
      padding: 10px 16px;
      background: var(--surface-secondary);
      border-bottom: 1px solid var(--border-color);
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
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

    .empty-icon {
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    .empty-title { font-weight: 600; font-size: 16px; margin-bottom: 4px; }
    .empty-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; max-width: 360px; margin-left: auto; margin-right: auto; }

    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--border-color);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class TransactionsComponent implements OnInit, OnDestroy {
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

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

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
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(250),
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadTransactions();
    });

    this.loadCategories();
    this.loadAccounts();
    this.loadTransactions();
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  onSearchInput(query: string) {
    this.searchSubject.next(query);
  }

  clearSearch() {
    this.searchQuery = '';
    this.loadTransactions();
  }

  selectCategoryChip(categoryId: string) {
    this.selectedCategory = categoryId;
    this.loadTransactions();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedCategory || this.selectedType || this.selectedAccount);
  }

  selectedCategoryName(): string {
    if (!this.selectedCategory) return '';
    const cat = this.categories().find(c => c._id === this.selectedCategory);
    return cat ? cat.name : '';
  }

  selectedAccountName(): string {
    if (!this.selectedAccount) return '';
    const acc = this.accounts().find(a => a._id === this.selectedAccount);
    return acc ? acc.name : '';
  }

  resetAllFilters() {
    this.searchQuery = '';
    this.selectedType = '';
    this.selectedCategory = '';
    this.selectedAccount = '';
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
    if (this.searchQuery && this.searchQuery.trim()) params.search = this.searchQuery.trim();
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

