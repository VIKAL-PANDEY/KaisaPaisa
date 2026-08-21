# Security Policy & Architecture Documentation for KAISAPAISA

## Overview

KAISAPAISA is built with a **Security by Design** posture. Personal financial data requires strict confidentiality, data isolation, and protection against authentication bypass, parameter tampering, and unauthorized data exposure.

---

## Security Controls Implemented

### 1. Authentication & Session Management
- **Password Hashing**: User passwords are never stored in plain text. Passwords are hashed using `bcryptjs` with a cost factor of **10 rounds**.
- **JWT (JSON Web Tokens)**: Stateless JWT tokens with explicit expiration time (`7d` default).
- **Session Protection**: JWTs carry minimal identity payload (`userId`, `email`). Verification occurs on every protected API route via `protect` middleware.

### 2. Authorization & Data Isolation (IDOR / BOLA Prevention)
- **Zero Client Trust**: The backend NEVER trusts `userId` or resource ownership passed in request bodies or query parameters.
- **Per-Request Scoping**: Every database query (`find`, `create`, `update`, `delete`) explicitly binds `{ userId: req.user.id }`.
- Users cannot read, modify, or delete another user's transactions, budgets, categories, debts, accounts, notifications, or goals.

### 3. Rate Limiting & Anti-Brute-Force
Implemented using `express-rate-limit`:
- **Login Endpoint (`/api/auth/login`)**: Max 5 attempts per 15 minutes per IP.
- **Registration Endpoint (`/api/auth/register`)**: Max 10 requests per hour per IP.
- **General API (`/api/*`)**: Max 120 requests per minute per authenticated user.
- Violations return standard `HTTP 429 Too Many Requests`.

### 4. Input Validation & Parameter Sanitization
- **Backend Validation**: Uses `express-validator` to enforce strict data formats, type constraints, numeric boundaries, and string lengths before business logic execution.
- **NoSQL Injection Prevention**: Object IDs are validated using Mongoose schemas. User queries are not constructed via unsafe string concatenation or direct object evaluation.
- **XSS Prevention**: User-supplied input (description, merchant names, person names) is sanitized and rendered cleanly without unsafe HTML execution (`innerHTML`).

### 5. Network & Transport Security
- **CORS Protection**: Access-Control-Allow-Origin is strictly restricted to configured frontend origins (`http://localhost:4200`). Wildcards (`*`) are disallowed for authenticated requests.
- **Security Headers**: Managed via `helmet` (HSTS, X-Content-Type-Options, Referrer-Policy, Frameguard).

### 6. Information Disclosure & Error Handling
- **Centralized Error Handling**: Express centralized error handler catches all uncaught exceptions.
- **Safe Client Responses**: Stack traces, database schema details, raw Mongo errors, environment paths, and server secrets are stripped before returning responses to the browser.
- Detailed technical errors are logged server-side only for maintenance.

### 7. Secrets Management
- All sensitive variables (`JWT_SECRET`, `MONGODB_URI`, `PORT`, `CLIENT_URL`) are isolated in `.env`.
- `.env` is listed in `.gitignore`.
- Safe template placeholders are provided in `.env.example`.

### 8. Post-MVP Future AI Security Architecture
When AI capabilities (Categorization, OCR, Assistant) are added in Phase 5:
- **Backend Gatekeeping**: AI models will NEVER directly access MongoDB or DB credentials.
- **Context Minimization**: The backend queries required user data, strips unnecessary PII, and sends only minimal context to the LLM API.
- **Client Shielding**: LLM API keys remain strictly on the backend.

---

## Known Limitations & Production Recommendations
1. **Distributed Rate Limiting**: The current rate limiter uses in-memory storage suitable for single-instance deployments. For horizontal scaling across multiple load-balanced instances, Redis backed rate limiting should be enabled.
2. **HTTPS Enforcement**: In production environments, reverse proxies (Nginx/Cloudflare) must enforce TLS 1.3 termination and set `Secure` / `HttpOnly` flags on authorization cookies.
