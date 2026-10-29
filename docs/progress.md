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
| 5 – Sidebar icons | pending | |
| 6 – Mobile navigation | pending | |
| 7 – Safety net + data toggle | pending | |
| 8 – Deployment | pending | |
| Final verification + push | pending | |

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
