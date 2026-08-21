import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-page">
      <div class="page-header">
        <h1 class="page-title">Financial Reports</h1>
        <p class="page-subtitle">Custom report generator with filters and comprehensive summary statistics.</p>
      </div>

      <!-- Filters Form -->
      <div class="kp-card filters-card">
        <div class="filters-grid">
          <div class="form-group">
            <label class="form-label">Start Date</label>
            <input type="date" [(ngModel)]="startDate" class="form-control">
          </div>

          <div class="form-group">
            <label class="form-label">End Date</label>
            <input type="date" [(ngModel)]="endDate" class="form-control">
          </div>

          <div class="form-group">
            <label class="form-label">Type</label>
            <select [(ngModel)]="selectedType" class="form-control">
              <option value="">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Category</label>
            <select [(ngModel)]="selectedCategory" class="form-control">
              <option value="">All Categories</option>
              <option *ngFor="let c of categories()" [value]="c._id">{{ c.name }}</option>
            </select>
          </div>
        </div>

        <div class="filter-actions">
          <button (click)="generateReport()" class="btn btn-primary btn-sm">Generate Report</button>
        </div>
      </div>

      <div *ngIf="loading()" class="p-4 text-center">Generating report...</div>

      <div *ngIf="!loading() && report()">
        <!-- Summary Stats Grid -->
        <div class="summary-grid">
          <div class="stat-card kp-card border-sage">
            <span class="stat-label">Total Income</span>
            <div class="stat-value text-sage">+₹{{ report().totalIncome | number:'1.2-2' }}</div>
          </div>

          <div class="stat-card kp-card border-peach">
            <span class="stat-label">Total Expenses</span>
            <div class="stat-value text-peach">−₹{{ report().totalExpenses | number:'1.2-2' }}</div>
          </div>

          <div class="stat-card kp-card border-blue">
            <span class="stat-label">Net Cash Flow</span>
            <div class="stat-value">₹{{ report().netCashFlow | number:'1.2-2' }}</div>
          </div>

          <div class="stat-card kp-card">
            <span class="stat-label">Savings Rate</span>
            <div class="stat-value">{{ report().savingsRate }}%</div>
          </div>
        </div>

        <!-- Top Categories Breakdown -->
        <div class="kp-card table-card mt-4">
          <div class="card-header">
            <h3>Top Categories in Report</h3>
          </div>
          <div class="table-responsive">
            <table class="kp-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Percentage of Expenses</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cat of report().topCategories">
                  <td class="font-bold">{{ cat.category }}</td>
                  <td>₹{{ cat.amount | number:'1.2-2' }}</td>
                  <td>{{ cat.percentage }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Detailed Transactions List -->
        <div class="kp-card table-card mt-4">
          <div class="card-header">
            <h3>Filtered Transactions ({{ report().transactionCount }})</h3>
          </div>
          <div class="table-responsive">
            <table class="kp-table">
              <thead>
                <tr>
                  <th>Title / Merchant</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let t of report().transactions">
                  <td>{{ t.merchant || t.categoryName }}</td>
                  <td><span class="badge badge-coming-soon">{{ t.categoryName }}</span></td>
                  <td>{{ t.date | date:'mediumDate' }}</td>
                  <td class="text-right font-bold" [class.text-sage]="t.type === 'income'" [class.text-peach]="t.type === 'expense'">
                    {{ t.type === 'income' ? '+' : '−' }}₹{{ t.amount | number:'1.2-2' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .filters-card { padding: 20px; }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }

    .filter-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid var(--border-color);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 20px;
    }

    .stat-label { font-size: 12.5px; color: var(--text-secondary); }
    .stat-value { font-size: 24px; font-weight: 700; margin-top: 4px; }
    .border-sage { border-left: 4px solid var(--pastel-sage); }
    .border-peach { border-left: 4px solid var(--pastel-peach); }
    .border-blue { border-left: 4px solid var(--pastel-blue); }

    .text-sage { color: #2E7D32; }
    .text-peach { color: #C62828; }
    .font-bold { font-weight: 600; }
    .text-right { text-align: right; }
    .mt-4 { margin-top: 20px; }
    .table-card { padding: 20px; }
    .card-header h3 { font-size: 16px; margin-bottom: 12px; }
  `]
})
export class ReportsComponent implements OnInit {
  private api = inject(ApiService);

  categories = signal<any[]>([]);
  report = signal<any>(null);
  loading = signal(false);

  startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
  endDate = new Date().toISOString().substring(0, 10);
  selectedType = '';
  selectedCategory = '';

  ngOnInit() {
    this.loadCategories();
    this.generateReport();
  }

  loadCategories() {
    this.api.get<{ success: boolean; categories: any[] }>('categories').subscribe({
      next: (res) => { if (res.success) this.categories.set(res.categories); }
    });
  }

  generateReport() {
    this.loading.set(true);
    const params: any = {};
    if (this.startDate) params.startDate = this.startDate;
    if (this.endDate) params.endDate = this.endDate;
    if (this.selectedType) params.type = this.selectedType;
    if (this.selectedCategory) params.categoryId = this.selectedCategory;

    this.api.get<{ success: boolean; report: any }>('reports', params).subscribe({
      next: (res) => {
        if (res.success) this.report.set(res.report);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
