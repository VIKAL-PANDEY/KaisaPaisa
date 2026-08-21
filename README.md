# KAISAPAISA

> **"Know your money. Control your spending."**

KAISAPAISA is a full-stack personal finance and budget management web application primarily designed for students but built for anyone seeking complete financial clarity and control.

---

## Key Product Features (MVP Scope: Phases 1–4)

- **Single Source of Truth Budget Engine**: Real-time daily, weekly, monthly, and category budget calculations dynamically computed directly from transaction records.
- **Automated Threshold Alerts**: In-app notifications for 80% warning state and 100% exceeded budget limit.
- **Financial Summary & Dashboard**: Income, expense, net savings, and balance metrics with MoM trends.
- **Spending Analytics & Charts**: Income vs Expenses timeline charts and Category breakdown donut visualization.
- **Interactive Financial Calendar**: Daily breakdown of transactions and daily totals mapped to an Asia/Kolkata timezone calendar grid.
- **Debt & Lending Tracking**: Record lent/borrowed money, track due dates, mark debts paid, and monitor net position.
- **Savings Goals**: Set target funds (e.g. Emergency Fund, New Laptop) with automated monthly required savings calculators.
- **Recurring Expenses & Subscriptions**: Manage monthly recurring commitments with payment alerts.
- **Financial Reports**: Custom date range, category, and account filters with comprehensive summary breakdowns.
- **Deterministic Financial Insights**: Rule-based spending observations (MoM changes, top categories, budget warnings) without AI hallucinations.
- **Integrated Coming Soon Modules**: AI Assistant, Receipt OCR, Spending Prediction, and Student Deals clearly showcased with "COMING SOON" badges.

---

## Fixed Technology Stack

- **Frontend**: Angular 21 (Standalone Components, TypeScript, RxJS, Chart.js, Zone.js)
- **Backend**: Node.js + Express.js (Modular Monolithic Architecture)
- **Database**: MongoDB (Mongoose ORM with indexing)
- **Authentication**: JWT (JSON Web Tokens) + `bcryptjs` password hashing
- **Styling**: Vanilla CSS with custom design tokens (`#F5F5F2` neutral background, pastel visual accents, Inter typography)

---

## Architecture Overview

```
Angular Frontend SPA (Port 4200)
       │
       ▼  REST APIs + JWT Header
Express Backend Server (Port 5000)
       │
       ├─► Security (Rate Limiting, Helmet, CORS, Error Handling)
       ├─► Auth & Per-Request Authorization Middleware
       ├─► Controllers & Business Logic
       └─► MongoDB Database (Port 27017)
```

---

## Getting Started & Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017/kaisapaisa` OR MongoDB Atlas URI

---

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd kaisapaisa/backend
   ```
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/kaisapaisa
   JWT_SECRET=kaisapaisa_super_secret_jwt_key_2026
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:4200
   NODE_ENV=development
   ```
4. (Optional) Seed demo user data:
   ```bash
   node seed.js
   ```
   *Demo User Credentials*: `student@kaisapaisa.com` / `Password123`

5. Start the backend development server:
   ```bash
   node server.js
   ```

---

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd kaisapaisa/frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Angular dev server:
   ```bash
   npm start
   # or
   npx ng serve --open
   ```
4. Access the application in your browser at `http://localhost:4200`.

---

## API Routes Summary

| Endpoint | Method | Description | Protected |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | POST | Register new user account | No |
| `/api/auth/login` | POST | Login and receive JWT token | No |
| `/api/auth/me` | GET | Fetch authenticated profile | Yes |
| `/api/transactions` | GET / POST | List & create transactions | Yes |
| `/api/transactions/:id` | PUT / DELETE | Update & delete transaction | Yes |
| `/api/budgets` | GET / POST | Get budget progress & set budget | Yes |
| `/api/accounts` | GET / POST | Manage manual financial accounts | Yes |
| `/api/categories` | GET / POST | View & add expense/income categories | Yes |
| `/api/analytics/dashboard` | GET | Financial summary & insights | Yes |
| `/api/analytics/trends` | GET | Income vs Expense trend data | Yes |
| `/api/analytics/calendar` | GET | Monthly calendar transaction breakdown | Yes |
| `/api/debts` | GET / POST | Debt & lending management | Yes |
| `/api/goals` | GET / POST | Savings goals management | Yes |
| `/api/recurring-expenses` | GET / POST | Subscriptions & recurring bills | Yes |
| `/api/notifications` | GET / PUT | In-app alerts & read states | Yes |
| `/api/reports` | GET | Filtered financial reports | Yes |

---

## Product Roadmap

- **Phases 1–4 (Current MVP)**: Foundation, Core Finance, User Experience, Advanced Finance.
- **Phase 5 (Coming Soon)**: AI Expense Categorization, Receipt OCR, Spending Prediction Engine, AI Financial Assistant.
- **Phase 6 (Coming Soon)**: Verified Student Deals, External Financial Integrations, Group Expense Splitting.
