import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ComingSoonCardComponent } from '../../shared/components/coming-soon-card/coming-soon-card';

@Component({
  selector: 'app-coming-soon-view',
  standalone: true,
  imports: [CommonModule, ComingSoonCardComponent],
  template: `
    <div class="cs-view-page">
      <div class="page-header">
        <h1 class="page-title">{{ currentFeature.title }}</h1>
        <p class="page-subtitle">Post-MVP Future Module Showcase</p>
      </div>

      <app-coming-soon-card 
        [title]="currentFeature.title"
        [description]="currentFeature.description"
        [phase]="currentFeature.phase"
      ></app-coming-soon-card>

      <div class="kp-card info-card">
        <h3>Feature Details & Product Roadmap</h3>
        <p>{{ currentFeature.details }}</p>
        
        <div class="roadmap-box">
          <div class="rm-tag">🔒 Security Protocol Note</div>
          <p>When this feature is unlocked in Phase {{ currentFeature.phase }}, intelligence services will communicate exclusively through a controlled backend gateway. AI models will never have direct database access.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cs-view-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .info-card h3 { font-size: 16px; margin-bottom: 10px; }
    .info-card p { font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; }

    .roadmap-box {
      margin-top: 18px;
      padding: 16px;
      background-color: var(--surface-secondary);
      border-radius: 8px;
      border-left: 4px solid var(--pastel-lavender);
    }

    .rm-tag { font-size: 12px; font-weight: 700; color: #512DA8; margin-bottom: 6px; }
  `]
})
export class ComingSoonViewComponent {
  private route = inject(ActivatedRoute);

  featureKey = '';
  currentFeature: any = {
    title: 'AI Assistant',
    description: 'Ask natural language questions about your spending and receive data-aware financial recommendations.',
    phase: '5',
    details: 'The AI Financial Assistant will analyze user-approved transaction queries server-side to help answer questions like "How much did I spend on food last month?" or "Can I afford ₹2,000 on headphones?".'
  };

  constructor() {
    this.route.params.subscribe(params => {
      this.featureKey = params['feature'] || 'ai-assistant';
      this.updateFeatureInfo();
    });
  }

  updateFeatureInfo() {
    if (this.featureKey === 'student-deals') {
      this.currentFeature = {
        title: 'Student Deals & Verified Discounts',
        description: 'Discover verified student discounts across food, books, software, and travel.',
        phase: '6',
        details: 'Future student deal integrations will connect with official partner APIs and legitimate curated sources without unauthorized web scraping.'
      };
    } else if (this.featureKey === 'receipt-ocr') {
      this.currentFeature = {
        title: 'Receipt OCR Scanning',
        description: 'Upload paper receipts and automatically extract merchant, date, items, and total amount.',
        phase: '5',
        details: 'Receipt scanning will use server-side document parsing to auto-populate transaction forms with high precision.'
      };
    } else if (this.featureKey === 'spending-prediction') {
      this.currentFeature = {
        title: 'End-of-Month Spending Prediction',
        description: 'Forecast likely end-of-month budget utilization based on historical spending velocity.',
        phase: '5',
        details: 'Statistical models will evaluate spending patterns during week 1 and week 2 to flag potential overspend risks before month end.'
      };
    } else {
      this.currentFeature = {
        title: 'AI Financial Assistant',
        description: 'Ask natural language questions about your spending and receive data-aware financial recommendations.',
        phase: '5',
        details: 'The AI Financial Assistant will analyze user-approved transaction queries server-side to help answer questions like "How much did I spend on food last month?" or "Can I afford ₹2,000 on headphones?".'
      };
    }
  }
}
