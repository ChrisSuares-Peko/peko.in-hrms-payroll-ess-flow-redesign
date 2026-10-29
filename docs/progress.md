# Prototype setup progress — Payroll & ESS Flow Redesign

| Phase | Status | Notes |
|---|---|---|
| G – Git baseline | done | No pre-existing .git. Baseline commit `0e4a756`. origin set. Not pushed. |
| 0 – Resolve scope | done | Confirmed; blockers 1–6 answered. |
| Backend reference | done | `backend-reference/` redacted (docs/backend-secret-scan.md), calculations in docs/backend-calculations.md. No .github/workflows exist (item 5: nothing to disable). |
| 1 – Remove login | done | MOCK_AUTHENTICATED_USER in loginSlice; persist migrate; tokenless requests short-circuit as cancelled. |
| 2 – Landing, sidebar, mounting | done | Sidebar = Payroll, ESS, Onboarding (staticCorporateServiceAccess). /ess/* and /onboarding/{payroll,ess}/* mounted in DashboardLayout; PrototypeScope redirects other services to /payroll. |
| 3 – Strip prod integrations | done | MoEngage loader + 94 call sites removed (AST codemod); FreshChat ChatService removed; CleverTap commented loader removed; Cashfree/Pusher aliased to inert stubs; Razorpay loader disabled; Firebase IncomingCallListener unmounted. |
| 4 – Tours and popups | done | productTour flags false. Other first-run popups (subscription first-time landing, "Complete your onboarding" banner, setup wizard) are suppressed by the Phase 2 seed on /payroll and shown on /onboarding/payroll/*. ESS has no tours. |
| 5 – Sidebar icons | done | 47 cdn.peko.one icons → 38 local SVGs; ESS = employee user.svg, Onboarding = profile-tick.svg; NavIcon ReactSVG constrained to 16px (verified 16x16). No other cdn.peko.one URLs in src. |
| 6 – Mobile navigation | done (no code change) | In this codebase MobileHeader already shows the hamburger for `role === CORPORATE \|\| SYSTEM` (src/components/molecular/nav-section/horizontal/MobileHeader.tsx:104), not `roleName === 'corporate sub user'`. Verified at 375px on /payroll, /ess, /onboarding/payroll/purchase: hamburger opens the drawer (Payroll, Employee Self-Service, Onboarding), icons 16x16, no horizontal overflow, no console errors. |
| 7 – Safety net + data toggle | done | No AppErrorBoundary existed; created src/prototype/AppErrorBoundary.tsx (message + stack, resets on route change) around <Router/>, and the dashboard layout's inner ErrorBoundary now uses the same fallback instead of ServiceNotAvailable. dataModeSlice ('dummy' default, persisted) + DataModeToggle (bottom-right, once in App.tsx); verified it persists across reload. |
| 8 – Deployment | done | vercel.json SPA rewrite; build → node --max-old-space-size=7168 ./node_modules/.bin/vite build (Linux/Vercel); build:windows → same flag via ./node_modules/vite/bin/vite.js (the .bin shim is a shell script on Windows). reportCompressedSize: false was already set. Output dir: dist (Vite default). public/serviceworker.js (MoEngage SW) removed. JSON files can't hold comments, so their PROTOTYPE-SETUP note lives here. |
| Final verification + push | done | See below. Baseline findings redacted and history rewritten before the first push. |

## Notes
- `Backend code/` was renamed to `backend-reference/`; its .env files were deleted and secrets redacted before the first commit containing it.
- `.env.production` is ignored via `.env.*` / `.env.production`.
- 3 "AIza…" secret-scan hits are base64 image data inside SVGs (false positives).

## DEMO_EMPLOYEE (hook-in point for the Phase 7 dataset task)
- `src/prototype/demoEmployee.ts` exports `DEMO_EMPLOYEE`, the only demo employee identity (id 1042, Arjun Mehta, Senior Product Designer, Design, reports to Priya Sharma, joined 2024-04-15, salary structure per docs/backend-calculations.md).
- `src/prototype/essSession.ts` → `useEssAuth()` replaces every `state.reducer.auth` read in `src/domains/employee`. With no token it scopes ESS API URLs to `user/<DEMO_EMPLOYEE.id>/payroll/...` without changing the stored (corporate) auth state.
- `useOnboardingStatus`, `useEmployeeProfile`, `useEmployeeDashboard`, `useRequiredOnboardingDocuments` return data built from `DEMO_EMPLOYEE` when there is no token. Onboarding status: in progress under `/onboarding/ess/*`, completed under `/ess/*`.
- The dataset task should plug list data (attendance, payslips, leaves, reimbursements, documents, announcements) in at the same points, keyed off `dataMode`.

## Payroll seed
- `src/prototype/payrollSeed.ts`: `PAYROLL_SEEDED_PROGRESS` (payrollAuth initial state, re-applied on rehydration) and `buildDemoSubscription()` (used by `useGetDetailsSubscription` when there is no token). `/onboarding/payroll/*` switches to `PAYROLL_ONBOARDING_PROGRESS` + pre-purchase subscription while open.
- Payroll package prices in the demo subscription are illustrative (no package seed exists in backend-reference).

## Vercel environment
No env vars are required. With every `VITE_*` blank: `SERVER_URL` becomes `undefined/api/v1`, but tokenless requests never reach the network; `FRONTEND_BASE_URL` only feeds the ESS-invite payload and the plan-purchase return URL (both inert); `VITE_PUSHER_APPKEY` goes to the Pusher stub. The rest (`VITE_USD_TO_INR/AED`, Paytm, Lean, Calendly, payment URLs, Peko Commerce, partner/SSO, Turbo flag) are only read by out-of-scope modules or have safe defaults.

## Final verification (production build, no env file — same as Vercel; served with `vite preview`)
1. `yarn type-check` pass; `yarn build:windows` pass (70s). `yarn build` uses `./node_modules/.bin/vite`, which is a shell shim on Windows, so it is for Vercel/Linux.
2. Fresh storage: `/` → `/payroll` (HR Dashboard), no login, no tour, 0 console errors.
3. 28 routes (all `/ess/*`, all 13 `/onboarding/payroll/*`, all 3 `/onboarding/ess/*`, `/set-password` ± `?demo=expired`, an unknown route, another service) opened directly (deep-link reload): no 404, sidebar on every dashboard route, no spinners, 0 console errors. ESS Home/Onboarding/Profile render; `/payroll` stays on the dashboard; `/onboarding/payroll/purchase` shows the purchase landing; `/set-password` valid, `?demo=expired` shows the expired view. `dist/` contains nothing from `backend-reference/`.
4. Stale localStorage (real-looking auth with role `user` + `corporate sub user`, payroll progress 0%): same results, mock identity and seeded payroll state re-applied.
5. 375px: hamburger opens the drawer on /payroll, /ess, /onboarding/ess/profile-completion; no horizontal overflow; icons 16x16.
6. Dummy/Empty toggle: one instance, bottom-right; Empty survives reload and route change.

## Pre-push redaction (history rewritten; nothing had been pushed)
Applied to the commit that introduced each file (`git filter-branch --index-filter`), so no commit ever contains the values; `refs/original` and reflogs were deleted and objects pruned. `git log -p --all -S <first 8 chars>` returns nothing for the Firebase key and the AWS key ID.
- `src/domains/dashboard/pekoConnect/config/firebaseConfig.ts:11-19`: all 7 Firebase config values → `'REDACTED-PROTOTYPE'` (keys kept, PROTOTYPE-SETUP comment). Peko Connect is outside the prototype and not mounted.
- `src/domains/dashboard/needHelp/types/type.ts:174`: commented-out Freshdesk sample `attachment_url` (presigned S3 URL with an AWS access key ID) replaced by a PROTOTYPE-SETUP comment line.
- `backend-reference/{kyc,officeAndBusiness,others,payment,paymentGateway,purchase,scheduler,travel,users}/configs/keys.json:2`: `jwtSecret` → `"REDACTED"`. The first scan skipped it because its value was a placeholder-looking word. JSON has no comments, so the tag is recorded here and in docs/backend-secret-scan.md.
- Known false positives, left untouched: `AIza…`-shaped substrings inside base64 PNG data in 5 SVGs (`src/assets/icons/GiftCard.svg:7`, `src/domains/dashboard/Domain & Hosting/assets/svg/ubuntu.svg:7`, `src/domains/dashboard/GiftCards/assets/icons/{allIcon,laptop,popcorns}.svg:7`).
- Re-verified after the rewrite: type-check, build:windows, Vercel-like build, 29 + 4 (stale) routes, 375px, toggle. All pass.

## Follow-ups (after first push)
- Purchase step (`/onboarding/payroll/purchase`) shows an "Illustrative pricing" tag (`src/prototype/onboarding/PurchaseStep.tsx`); prices stay as in `payrollSeed.ts`.
- docs/backend-calculations.md: approved demo assumptions (PT ₹200/month, HR-entered leave encashment) at the top; new §8a documents the overtime hourly-rate bug (`backend-reference/payroll/src/services/overtime.js:65-67`) with wrong (₹1.44) vs corrected (₹1,107.00) figures. backend-reference unchanged.
- Sidebar: new 16px outline icons `src/assets/icons/Onboarding.svg` (clipboard + check) and `src/assets/icons/Ess.svg` (person). ESS was also swapped because its previous icon was hard-coded red, so it looked active on every page.
- Re-verified: type-check, build:windows, Vercel-like build, 8-route sweep with no failures, icons 16x16.
