import { Component, inject, signal, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { TransactionEventService } from '../../core/services/transaction-event.service';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { BudgetTrackerComponent } from '../../shared/components/budget-tracker/budget-tracker';
import { Subscription } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BudgetTrackerComponent],
  template: `
    <div class="dashboard-page">
      <!-- Header -->
      <div class="dashboard-header">
        <div>
          <h1 class="page-title">Good morning, {{ userName() }}</h1>
          <p class="page-subtitle">Here's your financial overview for {{ currentMonthName }}.</p>
        </div>
        <div class="month-badge">
          <span>{{ currentMonthName }} {{ currentYear }}</span>
        </div>
      </div>

      <!-- Loading Skeleton -->
      <div *ngIf="loading()" class="loading-container">
        <div class="skeleton-card" *ngFor="let i of [1,2,3,4]"></div>
      </div>

      <div *ngIf="!loading()">
        <!-- Summary Cards Grid -->
        <div class="summary-grid">
          <div class="stat-card kp-card">
            <span class="stat-label">Total Balance</span>
            <div class="stat-value">₹{{ summary()?.totalBalance | number:'1.2-2' }}</div>
            <span class="stat-subtext">Across all accounts</span>
          </div>

          <div class="stat-card kp-card border-sage">
            <span class="stat-label">Monthly Income</span>
            <div class="stat-value text-sage">+₹{{ summary()?.monthlyIncome | number:'1.2-2' }}</div>
            <span class="stat-subtext text-sage" *ngIf="summary()?.incomeTrendPct !== undefined">
              {{ summary()?.incomeTrendPct! >= 0 ? '+' : '' }}{{ summary()?.incomeTrendPct }}% vs last month
            </span>
          </div>

          <div class="stat-card kp-card border-peach">
            <span class="stat-label">Monthly Expenses</span>
            <div class="stat-value text-peach">−₹{{ summary()?.monthlyExpenses | number:'1.2-2' }}</div>
            <span class="stat-subtext text-peach" *ngIf="summary()?.expenseTrendPct !== undefined">
              {{ summary()?.expenseTrendPct! >= 0 ? '+' : '' }}{{ summary()?.expenseTrendPct }}% vs last month
            </span>
          </div>

          <div class="stat-card kp-card border-blue">
            <span class="stat-label">Net Savings Rate</span>
            <div class="stat-value">{{ summary()?.savingsRate }}%</div>
            <span class="stat-subtext">Net savings: ₹{{ summary()?.netSavings | number:'1.2-2' }}</span>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-grid">
          <!-- Main Income vs Expenses Chart -->
          <div class="kp-card chart-card">
            <div class="card-header">
              <h3>Income vs Expenses</h3>
              <span class="card-subtitle">Last 6 months trend</span>
            </div>
            <div class="canvas-wrapper">
              <canvas #trendCanvas></canvas>
            </div>
          </div>

          <!-- Category Breakdown Donut Chart -->
          <div class="kp-card chart-card">
            <div class="card-header">
              <h3>Spending by Category</h3>
              <span class="card-subtitle">Current month breakdown</span>
            </div>
            <div class="canvas-wrapper donut-wrapper">
              <canvas #categoryCanvas></canvas>
            </div>
          </div>
        </div>

        <!-- Budget & Transactions Row -->
        <div class="details-grid">
          <!-- Active Budgets -->
          <div class="kp-card">
            <div class="card-header-flex">
              <h3>Active Budgets</h3>
              <a routerLink="/budgets" class="link-sm">View All</a>
            </div>

            <div *ngIf="activeBudgets().length === 0" class="empty-state-sm">
              <p>No active budgets set.</p>
              <a routerLink="/budgets" class="btn btn-secondary btn-sm">Set your first budget</a>
            </div>

            <div class="budget-list" id="dashboard-active-budgets-list">
              <app-budget-tracker
                *ngFor="let b of activeBudgets()"
                [budget]="b"
                [compact]="true"
              ></app-budget-tracker>
            </div>
          </div>

          <!-- Recent Transactions -->
          <div class="kp-card">
            <div class="card-header-flex">
              <h3>Recent Transactions</h3>
              <a routerLink="/transactions" class="link-sm">View All</a>
            </div>

            <div *ngIf="recentTransactions().length === 0" class="empty-state-sm">
              <p>No transactions recorded yet.</p>
              <a routerLink="/transactions" class="btn btn-primary btn-sm">Add your first transaction</a>
            </div>

            <div *ngIf="recentTransactions().length > 0" class="transaction-list">
              <div *ngFor="let t of recentTransactions()" class="tx-row">
                <div class="tx-info">
                  <div class="tx-merchant">{{ t.merchant || t.categoryName }}</div>
                  <div class="tx-cat-date">{{ t.categoryName }} • {{ t.date | date:'mediumDate' }} • {{ t.accountName }}</div>
                </div>
                <div class="tx-amount" [class.text-sage]="t.type === 'income'" [class.text-peach]="t.type === 'expense'">
                  {{ t.type === 'income' ? '+' : '−' }}₹{{ t.amount | number:'1.2-2' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Deterministic Financial Insights Section -->
        <div class="insights-section">
          <h3>Deterministic Financial Insights</h3>
          <div class="insights-grid">
            <div *ngFor="let ins of insights()" class="insight-card kp-card">
              <div class="ic-title">{{ ins.title }}</div>
              <div class="ic-msg">{{ ins.message }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .dashboard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .month-badge {
      background-color: var(--surface-secondary);
      border: 1px solid var(--border-color);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      backdrop-filter: var(--glass-blur);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .border-sage { border-left: 4px solid var(--color-income); }
    .border-peach { border-left: 4px solid var(--color-expense); }
    .border-blue { border-left: 4px solid var(--color-primary); }

    .stat-label {
      font-size: 12.5px;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .stat-value {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      margin: 8px 0;
    }

    .stat-subtext {
      font-size: 12px;
      color: var(--text-muted);
    }

    .text-sage { color: var(--color-income); }
    .text-peach { color: var(--color-expense); }

    .charts-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
    }

    @media (max-width: 1024px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }

    .chart-card {
      display: flex;
      flex-direction: column;
    }

    .card-header h3 {
      font-size: 16px;
      color: var(--text-primary);
    }

    .card-subtitle {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .canvas-wrapper {
      position: relative;
      height: 260px;
      margin-top: 16px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    @media (max-width: 900px) {
      .details-grid {
        grid-template-columns: 1fr;
      }
    }

    .card-header-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .link-sm {
      font-size: 13px;
      color: var(--color-soft-blue);
      font-weight: 600;
      text-decoration: none;
    }

    .link-sm:hover {
      text-decoration: underline;
    }

    .empty-state-sm {
      text-align: center;
      padding: 24px 0;
      color: var(--text-secondary);
      font-size: 13px;
    }

    .budget-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .transaction-list {
      display: flex;
      flex-direction: column;
    }

    .tx-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);
    }

    .tx-row:last-child {
      border-bottom: none;
    }

    .tx-merchant {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .tx-cat-date {
      font-size: 11.5px;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .tx-amount {
      font-size: 15px;
      font-weight: 700;
    }

    .insights-section {
      margin-top: 12px;
    }

    .insights-section h3 {
      font-size: 16px;
      color: var(--text-primary);
      margin-bottom: 14px;
    }

    .insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .insight-card {
      background: var(--surface-secondary);
      border-left: 3.5px solid var(--color-soft-blue);
    }

    .ic-title {
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .ic-msg {
      font-size: 13px;
      color: var(--text-secondary);
    }

    .loading-container {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .skeleton-card {
      height: 100px;
      background-color: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-card);
      animation: pulse 1.2s infinite ease-in-out;
    }

    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private txEvents = inject(TransactionEventService);
  private txSub?: Subscription;

  @ViewChild('trendCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryCanvas') categoryCanvas!: ElementRef<HTMLCanvasElement>;

  loading = signal(true);
  summary = signal<any>(null);
  recentTransactions = signal<any[]>([]);
  activeBudgets = signal<any[]>([]);
  insights = signal<any[]>([]);
  trendsData = signal<any[]>([]);
  categoryData = signal<any[]>([]);

  currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });
  currentYear = new Date().getFullYear();

  trendChart?: Chart;
  categoryChart?: Chart;

  userName(): string {
    return this.authService.currentUser()?.name || 'User';
  }

  ngOnInit() {
    this.loadDashboardData();

    // Reactively refresh dashboard charts, summary totals, and active budgets on any transaction/budget event
    this.txSub = this.txEvents.transactionUpdated$.subscribe(() => {
      this.loadDashboardData();
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.renderCharts(), 100);
  }

  ngOnDestroy() {
    this.txSub?.unsubscribe();
    if (this.trendChart) this.trendChart.destroy();
    if (this.categoryChart) this.categoryChart.destroy();
  }

  loadDashboardData() {
    this.loading.set(true);
    this.api.get<{
      success: boolean;
      summary: any;
      categoryBreakdown: any[];
      recentTransactions: any[];
      activeBudgets: any[];
      insights: any[];
    }>('analytics/dashboard').subscribe({
      next: (res) => {
        if (res.success) {
          this.summary.set(res.summary);
          this.recentTransactions.set(res.recentTransactions);
          this.activeBudgets.set(res.activeBudgets);
          this.insights.set(res.insights);
          this.categoryData.set(res.categoryBreakdown);
        }
        this.loadTrendsData();
      },
      error: () => this.loading.set(false)
    });
  }

  loadTrendsData() {
    this.api.get<{ success: boolean; trends: any[] }>('analytics/trends').subscribe({
      next: (res) => {
        if (res.success) {
          this.trendsData.set(res.trends);
        }
        this.loading.set(false);
        setTimeout(() => this.renderCharts(), 100);
      },
      error: () => this.loading.set(false)
    });
  }

  renderCharts() {
    if (this.trendCanvas && this.trendsData().length > 0) {
      if (this.trendChart) this.trendChart.destroy();
      const labels = this.trendsData().map(t => t.month);
      const incomeVals = this.trendsData().map(t => t.income);
      const expenseVals = this.trendsData().map(t => t.expense);

      this.trendChart = new Chart(this.trendCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Income',
              data: incomeVals,
              backgroundColor: '#97B9FF',
              borderRadius: 4
            },
            {
              label: 'Expenses',
              data: expenseVals,
              backgroundColor: '#262262',
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { 
              position: 'top',
              labels: { color: '#A6A6A6', font: { family: 'Inter', size: 12 } }
            } 
          },
          scales: {
            x: { 
              grid: { display: false },
              ticks: { color: '#777777', font: { family: 'Inter', size: 11 } }
            },
            y: { 
              grid: { color: 'rgba(255, 255, 255, 0.08)' },
              ticks: { color: '#777777', font: { family: 'Inter', size: 11 } }
            }
          }
        }
      });
    }

    if (this.categoryCanvas && this.categoryData().length > 0) {
      if (this.categoryChart) this.categoryChart.destroy();
      const labels = this.categoryData().map(c => c.category);
      const dataVals = this.categoryData().map(c => c.amount);

      this.categoryChart = new Chart(this.categoryCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: dataVals,
            backgroundColor: ['#262262', '#97B9FF', '#4B45A1', '#6B6B6B', '#38337F', '#7E9CD8'],
            borderWidth: 2,
            borderColor: '#141414'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { 
              position: 'right',
              labels: { color: '#A6A6A6', font: { family: 'Inter', size: 11 }, boxWidth: 12 }
            } 
          }
        }
      });
    }
  }
}
