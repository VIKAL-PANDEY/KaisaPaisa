import { Component, inject, signal, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-page">
      <div class="page-header">
        <h1 class="page-title">Spending Analytics</h1>
        <p class="page-subtitle">Visual analytics revealing spending patterns and category trends.</p>
      </div>

      <div *ngIf="loading()" class="p-4 text-center">Loading analytics...</div>

      <div *ngIf="!loading()">
        <!-- Summary Cards -->
        <div class="summary-grid">
          <div class="stat-card kp-card">
            <span class="stat-label">Net Savings Rate</span>
            <div class="stat-value">{{ summary()?.savingsRate }}%</div>
            <span class="stat-subtext">Net cash flow: ₹{{ summary()?.netSavings | number:'1.2-2' }}</span>
          </div>

          <div class="stat-card kp-card">
            <span class="stat-label">Monthly Income</span>
            <div class="stat-value text-sage">₹{{ summary()?.monthlyIncome | number:'1.2-2' }}</div>
            <span class="stat-subtext">Current month income</span>
          </div>

          <div class="stat-card kp-card">
            <span class="stat-label">Monthly Expenses</span>
            <div class="stat-value text-peach">₹{{ summary()?.monthlyExpenses | number:'1.2-2' }}</div>
            <span class="stat-subtext">Current month expenses</span>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="charts-row">
          <div class="kp-card chart-box">
            <h3>Income vs Expenses Trends</h3>
            <div class="canvas-wrapper">
              <canvas #trendCanvas></canvas>
            </div>
          </div>

          <div class="kp-card chart-box">
            <h3>Category Breakdown</h3>
            <div class="canvas-wrapper">
              <canvas #categoryCanvas></canvas>
            </div>
          </div>
        </div>

        <!-- Category Table Analysis -->
        <div class="kp-card table-card">
          <div class="card-header">
            <h3>Category Analysis Table</h3>
          </div>
          <div class="table-responsive">
            <table class="kp-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Total Amount</th>
                  <th>Percentage of Expenses</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of categories()">
                  <td class="font-bold">{{ c.category }}</td>
                  <td>₹{{ c.amount | number:'1.2-2' }}</td>
                  <td>
                    <div class="progress-row">
                      <span>{{ c.percentage }}%</span>
                      <div class="progress-bar-bg flex-1">
                        <div class="progress-bar-fill fill-normal" [style.width.%]="c.percentage"></div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Deterministic Insights -->
        <div class="insights-box">
          <h3>Deterministic Spending Insights</h3>
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
    .analytics-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .stat-label { font-size: 13px; color: var(--text-secondary); }
    .stat-value { font-size: 26px; font-weight: 700; margin: 6px 0; }
    .stat-subtext { font-size: 12px; color: var(--text-muted); }
    .text-sage { color: #2E7D32; }
    .text-peach { color: #C62828; }

    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    @media (max-width: 900px) {
      .charts-row { grid-template-columns: 1fr; }
    }

    .chart-box h3 { font-size: 16px; margin-bottom: 12px; }

    .canvas-wrapper {
      position: relative;
      height: 280px;
    }

    .table-card { padding: 20px; }
    .table-card h3 { font-size: 16px; margin-bottom: 14px; }

    .font-bold { font-weight: 600; }

    .progress-row {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
    }

    .flex-1 { flex: 1; }

    .insights-box h3 { font-size: 16px; margin-bottom: 14px; }
    .insights-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .insight-card { background-color: var(--surface-secondary); border-left: 4px solid var(--pastel-blue); }
    .ic-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .ic-msg { font-size: 13px; color: var(--text-secondary); }
  `]
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  private api = inject(ApiService);

  @ViewChild('trendCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryCanvas') categoryCanvas!: ElementRef<HTMLCanvasElement>;

  loading = signal(true);
  summary = signal<any>(null);
  categories = signal<any[]>([]);
  insights = signal<any[]>([]);
  trendsData = signal<any[]>([]);

  trendChart?: Chart;
  categoryChart?: Chart;

  ngOnInit() {
    this.loadAnalytics();
  }

  ngAfterViewInit() {}

  loadAnalytics() {
    this.loading.set(true);
    this.api.get<{
      success: boolean;
      summary: any;
      categoryBreakdown: any[];
      insights: any[];
    }>('analytics/dashboard').subscribe({
      next: (res) => {
        if (res.success) {
          this.summary.set(res.summary);
          this.categories.set(res.categoryBreakdown);
          this.insights.set(res.insights);
        }
        this.loadTrends();
      },
      error: () => this.loading.set(false)
    });
  }

  loadTrends() {
    this.api.get<{ success: boolean; trends: any[] }>('analytics/trends').subscribe({
      next: (res) => {
        if (res.success) this.trendsData.set(res.trends);
        this.loading.set(false);
        setTimeout(() => this.renderCharts(), 100);
      },
      error: () => this.loading.set(false)
    });
  }

  renderCharts() {
    if (this.trendCanvas && this.trendsData().length > 0) {
      if (this.trendChart) this.trendChart.destroy();
      this.trendChart = new Chart(this.trendCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: this.trendsData().map(t => t.month),
          datasets: [
            { label: 'Income', data: this.trendsData().map(t => t.income), borderColor: '#2E7D32', backgroundColor: '#A8C3B0', tension: 0.3 },
            { label: 'Expenses', data: this.trendsData().map(t => t.expense), borderColor: '#C62828', backgroundColor: '#E8B7A6', tension: 0.3 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    if (this.categoryCanvas && this.categories().length > 0) {
      if (this.categoryChart) this.categoryChart.destroy();
      this.categoryChart = new Chart(this.categoryCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: this.categories().map(c => c.category),
          datasets: [{ label: 'Amount (₹)', data: this.categories().map(c => c.amount), backgroundColor: '#A9BDD2', borderRadius: 4 }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }
}
