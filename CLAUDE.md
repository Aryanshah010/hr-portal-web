# CLAUDE.md — NexusHR Portal

Single source of truth for developers and AI agents working on this repository.

**Rule for this file: it must describe what the code actually does.** An earlier
revision claimed controls that did not exist (Cloudflare WAF, an SSRF middleware,
Dockerfiles, a SAST workflow, CSP, password-reuse tracking). Every claim below
names the file that implements it so it can be checked in seconds.

---

## 1. Project Overview & Tech Stack

NexusHR is a secure, local-first HR and payroll portal built around a
"security by design" architecture.

- **Frontend:** React 19, TypeScript, Vite, React Router, Zod, Axios (`apiClient.ts`)
- **Backend:** Node.js, Express 5, MongoDB via Mongoose 9
- **Security & crypto:** native TOTP (`otplib`), `zxcvbn` (client *and* server),
  AES-256-GCM, RSA-SHA256 signing + verification, HMAC-SHA256, local `mkcert`
  TLS 1.3 certificates
- **Ports:** backend `5001` (avoids the macOS AirPlay conflict), frontend `5173`
- **Philosophy:** 100% free/local tooling. No paid cloud dependencies. eSewa is a
  **local simulation** of the v2 payout API; Twilio SMS prints to the backend
  console in development.

There is **no Cloudflare integration, no Docker setup and no CI pipeline** in
this repository. Do not reintroduce claims about them.

---

## 2. Repository Layout

```text
hr-portal-web/
├── hr-portal-backend/
│   ├── config/         # environment + database bootstrap
│   ├── controllers/    # request handling, input extraction
│   ├── middleware/     # authGuard, csrf, cors, rate limiting, NoSQL sanitizer,
│   │                   # security headers, upload + request validation
│   ├── models/         # Mongoose schemas
│   ├── repositories/   # data-access layer
│   ├── services/       # business logic + cryptography
│   ├── routes/         # API route mappings
│   ├── utils/          # crypto helpers, tokens, SSRF validator, payslips
│   └── server.js       # HTTPS entrypoint (port 5001)
└── hr-portal-frontend/
    ├── src/components/ # UI, route guards (ProtectedRoute, RoleGuard)
    ├── src/context/    # auth + toast providers
    ├── src/pages/      # views
    ├── src/services/   # axios client with CSRF interceptors
    ├── src/types/      # shared interfaces
    └── vite.config.ts  # dev HTTPS, API proxy, and the SPA's CSP
```

---

## 3. Security Controls

### A. Authentication & identity

- **MFA** — TOTP via `otplib`, QR enrolment (`services/authService.js`).
- **OAuth 2.0** — Google, with HMAC-signed state and ID-token audience
  verification (`services/oauthService.js`).
- **Brute force** — global IP rate limiting plus per-purpose limiters
  (`middleware/rateLimiter.js`); 15-minute lockout after 5 failures; offline SVG
  CAPTCHA required after the first failure. CAPTCHA challenges are **single-use
  and server-stored** (`models/CaptchaChallenge.js`) — redeeming one burns it
  whether or not the answer was right.
- **Password policy** — minimum 12 characters, 4 character classes, **and a
  `zxcvbn` score of 3+ enforced server-side** in `middleware/validator.js`
  (`strongPassword`). The last 5 password hashes are kept and compared with
  bcrypt on every change, so reuse is genuinely blocked.
- **Password lifecycle** — 90-day expiry (`middleware/authGuard.js`).
  Self-service change at `PATCH /api/me/password`; HR-triggered reset at
  `POST /api/employees/:id/reset-password`, which SMSes a generated temporary
  password and never returns it in the response. The change endpoint is exempt
  from the expiry block so expiry is not a permanent lockout.
- **Session binding** — SHA-256 of the User-Agent embedded in an HttpOnly,
  Secure, SameSite JWT cookie. `securityVersion` is **incremented** on suspend,
  role change and password change, so every previously issued token dies.

### B. Defensive engineering

- **NoSQL injection** — `middleware/nosqlSanitizer.js` rejects operator keys
  (`$…`), dot-notation traversal, `$where`, null bytes and Unicode-escaped
  operators, and logs `NOSQL_INJECTION_ATTEMPT`. Value-pattern scanning is
  deliberately skipped for credential fields, which are bcrypt-compared and never
  reach a query filter — scanning them rejected legitimate strong passwords.
- **SSRF** — `utils/ssrfValidator.js` guards the avatar endpoint: HTTPS only,
  default port only, optional host allowlist (`AVATAR_HOST_ALLOWLIST`), DNS
  resolution with **every** returned address checked against loopback,
  link-local, RFC1918 and cloud-metadata ranges. Redirects are refused rather
  than followed. Rejections log `SSRF_ATTEMPT`. Known limit: DNS rebinding
  between validation and fetch (documented in the file).
- **CSRF** — HMAC double-submit tokens on every state-changing request, plus a
  **required** matching `Origin` header (`middleware/csrf.js`). Non-browser
  clients such as `curl` must send `Origin` to perform writes.
- **CSP** — the API sets `default-src 'none'; frame-ancestors 'none'`
  (`middleware/securityHeaders.js`); it serves JSON and binary only, never HTML.
  The SPA's own policy is served by whatever hosts the frontend — in development
  the Vite dev server (`vite.config.ts`).
- **CORS** — single trusted origin (`middleware/corsPolicy.js`). Requests without
  an `Origin` are allowed at the CORS layer because browsers omit it on
  same-origin GETs; write protection is enforced in `csrfProtection` instead.
- **Proxy trust** — `TRUST_PROXY` must equal the real number of proxies in front
  of the app. Set to `1` in development because Vite forwards `X-Forwarded-For`
  (`xfwd: true`). Too high allows IP spoofing; too low collapses every client
  into one rate-limit bucket.
- **Errors** — generic responses only; no stack traces reach the client.

### C. Cryptography & data protection

- **PII at rest** — national ID, bank details and base salary are AES-256-GCM
  encrypted before insertion (`utils/cryptoUtil.js`).
- **Documents & avatars** — encrypted to `.enc` files with UUID names, `0600`
  permissions, under a `0700` directory. Uploads are content-sniffed by magic
  bytes, not by the declared MIME type. Downloads emit `PII_ACCESS`.
- **In transit** — TLS 1.3 via local `mkcert` certificates, HSTS via Helmet.
- **Financial integrity** — payouts are signed RSA-SHA256 over a canonical
  payload and **verifiable**: `GET /api/transactions/:id/verify` recomputes the
  payload and checks the signature, surfaced as a Verify button on
  `/admin/transactions`. The server refuses to start if the RSA key files are
  missing rather than generating an ephemeral key.
- **Key safety** — the app refuses to boot on the built-in placeholder encryption
  keys unless `ALLOW_INSECURE_DEV_KEYS=true` is set explicitly.

### D. Audit trail

`models/AuditLog.js` is append-only: `pre("save")` blocks re-saves and query
middleware blocks `update*`, `replaceOne` and every `delete*`. Records carry
actor, role, IP, user-agent, target resource and severity, and expire after 2
years. Known limit: the guard is enforced by Mongoose, so direct database access
bypasses it.

Every event type in the `AUDIT_EVENTS` enum has a real emission site. Authentication
(`AUTH_LOGIN_SUCCESS`/`FAILURE`, `AUTH_ACCOUNT_LOCKED`/`UNLOCKED`, `AUTH_LOGOUT`,
`AUTH_TOKEN_INVALID`, `AUTH_PASSWORD_CHANGED`, `AUTH_PASSWORD_RESET_REQUESTED`,
MFA events), threats (`NOSQL_INJECTION_ATTEMPT`, `SSRF_ATTEMPT`,
`CSRF_TOKEN_INVALID`, `RATE_LIMIT_EXCEEDED`), authorization
(`AUTHZ_ACCESS_DENIED`, `AUTHZ_IDOR_ATTEMPT`), mutations (employee, salary,
payslip, payroll-run and disbursement events) and access (`PII_ACCESS`,
`DATA_EXPORT_REQUESTED`).

---

## 4. Roles & Routing

### Public
- `/` — landing page; authenticated users are redirected by `<ProtectedRoute invertGuard>`.
- `/login` — returns **428** when a CAPTCHA is required, **200** with
  `nextStep: "MFA_CHALLENGE"` when MFA is enabled.
- `/register` — phone OTPs print to the backend console in development.

### Employee (Employee or HR)
`/dashboard` · `/profile` (details, avatar, password change, data export) ·
`/attendance` · `/documents` · `/payslips` · `/reviews`

### HR only (via `<RoleGuard>`)
`/admin/dashboard` · `/admin/employees` (salary, role, password reset,
reactivate) · `/admin/audit` · `/admin/payroll` · `/admin/transactions`
(signature verification) · `/admin/reviews`

**Payroll uses segregation of duties**: the HR who creates a run cannot approve
it, so a second active HR account is required. Blocked self-approvals are audited.

---

## 5. Rules for Contributors & AI Agents

1. **File edits** — use proper edit tooling, never `cat`/shell redirection to
   overwrite source files.
2. **No paid cloud dependencies** — the local/free stack is deliberate.
3. **Never regenerate** `DATABASE_ENCRYPTION_KEY`, `PAYROLL_ENCRYPTION_KEY` or
   `private.pem`. Doing so makes existing encrypted records and `.enc` files
   permanently unreadable and invalidates every stored signature.
4. **Do not document a control that is not wired up.** If it is aspirational, say
   so explicitly or leave it out.
5. **Verify against the database** when changing security logic. There is no test
   suite (`npm test` runs `node --test` with no test files); use throwaway
   scripts inside `hr-portal-backend/` and delete them afterwards.

---

## 6. Assessment Context

- **CIA triad** — confidentiality (AES-256-GCM, RBAC), integrity (RSA signatures
  that are actually verified, append-only audit log, immutable ledger rows),
  availability (rate limits, IP blocklist).
- **Threat modelling** — NoSQL injection and SSRF are the headline classes, both
  with demonstrable blocking paths and audit evidence.
- **Method** — white-box (CW2), progressing from vulnerable implementations to
  patched, verified defences.

### Live demos worth showing
1. Wrong password → `AUTH_LOGIN_FAILURE` appears on `/admin/audit` with the real IP.
2. Avatar URL `http://169.254.169.254/latest/meta-data/` → 403 + `SSRF_ATTEMPT`.
3. Edit a transaction's amount directly in MongoDB → Verify flips to **TAMPERED**.
4. `{"password": {"$gt": ""}}` at login → blocked + `NOSQL_INJECTION_ATTEMPT`,
   while `$uperSecret123!` is accepted as an ordinary password.
5. Try to approve a payroll run you created → 403 + `PAYROLL_RUN_APPROVAL_DENIED`.
