import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="calendar-page">
      <div class="header-flex">
        <div>
          <h1 class="page-title">Financial Calendar</h1>
          <p class="page-subtitle">Historical expense view by date with daily totals (Asia/Kolkata timezone).</p>
        </div>
        <div class="month-selector">
          <button (click)="prevMonth()" class="btn btn-secondary btn-sm">&larr; Prev</button>
          <span class="month-label">{{ currentMonthName }} {{ currentYear }}</span>
          <button (click)="nextMonth()" class="btn btn-secondary btn-sm">Next &rarr;</button>
        </div>
      </div>

      <div *ngIf="loading()" class="p-4 text-center">Loading calendar data...</div>

      <div *ngIf="!loading()" class="calendar-grid-card kp-card">
        <!-- Weekday Headers -->
        <div class="calendar-header-row">
          <div *ngFor="let day of weekDays" class="weekday-header">{{ day }}</div>
        </div>

        <!-- Month Days Grid -->
        <div class="days-grid">
          <!-- Blank padding days -->
          <div *ngFor="let blank of blankDays" class="day-cell blank"></div>

          <!-- Active Month Days -->
          <div 
            *ngFor="let day of monthDays" 
            class="day-cell" 
            [class.selected]="selectedDateKey === day.dateKey"
            (click)="selectDate(day)"
          >
            <div class="day-number">{{ day.dayNumber }}</div>
            <div class="day-totals" *ngIf="day.expenseTotal > 0 || day.incomeTotal > 0">
              <span *ngIf="day.incomeTotal > 0" class="inc-badge">+₹{{ day.incomeTotal | number:'1.0-0' }}</span>
              <span *ngIf="day.expenseTotal > 0" class="exp-badge">−₹{{ day.expenseTotal | number:'1.0-0' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Date Detail Drawer / Modal -->
      <div *ngIf="selectedDayDetail" class="kp-card detail-card">
        <div class="detail-header">
          <h3>Activity for {{ selectedDayDetail.dateKey }}</h3>
          <span class="total-tag">Daily Spent: ₹{{ selectedDayDetail.expenseTotal | number:'1.2-2' }}</span>
        </div>

        <div *ngIf="selectedDayDetail.transactions.length === 0" class="empty-detail">
          No transactions recorded on this date.
        </div>

        <div *ngIf="selectedDayDetail.transactions.length > 0" class="tx-list">
          <div *ngFor="let t of selectedDayDetail.transactions" class="tx-item">
            <div class="tx-main">
              <span class="tx-name">{{ t.merchant || t.category }}</span>
              <span class="tx-cat badge" [class.badge-income]="t.type === 'income'" [class.badge-expense]="t.type === 'expense'">
                {{ t.category }}
              </span>
            </div>
            <div class="tx-amt" [class.text-sage]="t.type === 'income'" [class.text-peach]="t.type === 'expense'">
              {{ t.type === 'income' ? '+' : '−' }}₹{{ t.amount | number:'1.2-2' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .calendar-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .header-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .month-selector {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .month-label {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .calendar-grid-card {
      padding: 20px;
    }

    .calendar-header-row {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 10px;
      margin-bottom: 10px;
    }

    .days-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 8px;
    }

    .day-cell {
      min-height: 80px;
      background-color: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 8px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: var(--transition-fast);
    }

    .day-cell:hover {
      background-color: rgba(255, 255, 255, 0.07);
      border-color: var(--border-hover);
    }

    .day-cell.selected {
      border: 2px solid var(--color-soft-blue);
      background-color: rgba(151, 185, 255, 0.1);
    }

    .day-cell.blank {
      background: transparent;
      border: none;
      cursor: default;
    }

    .day-number {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .day-totals {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .inc-badge {
      font-size: 10px;
      font-weight: 700;
      color: var(--color-soft-blue);
      background-color: var(--bg-income-light);
      border: 1px solid rgba(151, 185, 255, 0.2);
      padding: 1px 4px;
      border-radius: 4px;
    }

    .exp-badge {
      font-size: 10px;
      font-weight: 700;
      color: var(--color-expense);
      background-color: var(--bg-expense-light);
      border: 1px solid rgba(229, 115, 115, 0.2);
      padding: 1px 4px;
      border-radius: 4px;
    }

    .detail-card {
      padding: 20px;
    }

    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 12px;
      margin-bottom: 16px;
    }

    .detail-header h3 { font-size: 16px; color: var(--text-primary); }

    .total-tag {
      font-size: 13px;
      font-weight: 700;
      color: var(--color-expense);
      background-color: var(--bg-expense-light);
      border: 1px solid rgba(229, 115, 115, 0.2);
      padding: 4px 10px;
      border-radius: 12px;
    }

    .empty-detail {
      color: var(--text-secondary);
      font-size: 13px;
    }

    .tx-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .tx-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background-color: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }

    .tx-main { display: flex; align-items: center; gap: 10px; }
    .tx-name { font-size: 13.5px; font-weight: 600; color: var(--text-primary); }
    .tx-amt { font-size: 14px; font-weight: 700; }

    .text-sage { color: var(--color-soft-blue); }
    .text-peach { color: var(--color-expense); }
  `]
})
export class CalendarComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  currentDate = new Date();
  currentMonthName = '';
  currentYear = 0;

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  blankDays: number[] = [];
  monthDays: any[] = [];

  calendarDataMap: any = {};
  selectedDateKey = '';
  selectedDayDetail: any = null;

  ngOnInit() {
    this.updateMonthYear();
    this.loadCalendarData();
  }

  updateMonthYear() {
    this.currentMonthName = this.currentDate.toLocaleString('en-US', { month: 'long' });
    this.currentYear = this.currentDate.getFullYear();
  }

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.updateMonthYear();
    this.loadCalendarData();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.updateMonthYear();
    this.loadCalendarData();
  }

  loadCalendarData() {
    this.loading.set(true);
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth() + 1;

    this.api.get<{ success: boolean; calendar: any[] }>('analytics/calendar', { year, month }).subscribe({
      next: (res) => {
        if (res.success) {
          this.calendarDataMap = {};
          res.calendar.forEach(item => {
            this.calendarDataMap[item.date] = item;
          });
          this.buildCalendarGrid();
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  buildCalendarGrid() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    this.blankDays = Array(firstDayIndex).fill(0);

    const days = [];
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayData = this.calendarDataMap[dateKey] || {
        date: dateKey,
        incomeTotal: 0,
        expenseTotal: 0,
        transactions: []
      };

      days.push({
        dayNumber: i,
        dateKey,
        incomeTotal: dayData.incomeTotal,
        expenseTotal: dayData.expenseTotal,
        transactions: dayData.transactions
      });
    }

    this.monthDays = days;
    if (days.length > 0) {
      this.selectDate(days[0]);
    }
  }

  selectDate(day: any) {
    this.selectedDateKey = day.dateKey;
    this.selectedDayDetail = day;
  }
}
