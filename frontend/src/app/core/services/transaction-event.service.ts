import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransactionEventService {
  private updateSource = new Subject<void>();

  // Observable for components (Dashboard, Budgets, Analytics, Overview) to react to updates
  transactionUpdated$ = this.updateSource.asObservable();

  notifyTransactionUpdated(): void {
    this.updateSource.next();
  }

  notifyBudgetUpdated(): void {
    this.updateSource.next();
  }

  notifyDataUpdated(): void {
    this.updateSource.next();
  }
}
