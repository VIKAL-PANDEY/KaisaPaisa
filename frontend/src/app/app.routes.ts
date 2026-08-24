import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/auth-form/auth-form').then(m => m.AuthFormComponent),
    data: { mode: 'login' }
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/auth-form/auth-form').then(m => m.AuthFormComponent),
    data: { mode: 'register' }
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent)
  },
  {
    path: 'transactions',
    canActivate: [authGuard],
    loadComponent: () => import('./features/transactions/transactions').then(m => m.TransactionsComponent)
  },
  {
    path: 'budgets',
    canActivate: [authGuard],
    loadComponent: () => import('./features/budgets/budgets').then(m => m.BudgetsComponent)
  },
  {
    path: 'analytics',
    canActivate: [authGuard],
    loadComponent: () => import('./features/analytics/analytics').then(m => m.AnalyticsComponent)
  },
  {
    path: 'calendar',
    canActivate: [authGuard],
    loadComponent: () => import('./features/calendar/calendar').then(m => m.CalendarComponent)
  },
  {
    path: 'debt-lending',
    canActivate: [authGuard],
    loadComponent: () => import('./features/debt-lending/debt-lending').then(m => m.DebtLendingComponent)
  },
  {
    path: 'goals',
    canActivate: [authGuard],
    loadComponent: () => import('./features/savings-goals/savings-goals').then(m => m.SavingsGoalsComponent)
  },
  {
    path: 'recurring',
    canActivate: [authGuard],
    loadComponent: () => import('./features/recurring/recurring').then(m => m.RecurringComponent)
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () => import('./features/reports/reports').then(m => m.ReportsComponent)
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile-settings/profile-settings').then(m => m.ProfileSettingsComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
