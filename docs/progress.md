# Prototype setup progress — Payroll & ESS Flow Redesign

| Phase | Status | Notes |
|---|---|---|
| G – Git baseline | done | No pre-existing .git. Baseline commit `0e4a756`. origin set. Not pushed. |
| 0 – Resolve scope | done | Confirmed; blockers 1–6 answered. |
| Backend reference | done | `backend-reference/` redacted (docs/backend-secret-scan.md), calculations in docs/backend-calculations.md. No .github/workflows exist (item 5: nothing to disable). |
| 1 – Remove login | done | MOCK_AUTHENTICATED_USER in loginSlice; persist migrate; tokenless requests short-circuit as cancelled. |
| 2 – Landing, sidebar, mounting | pending | |
| 3 – Strip prod integrations | pending | |
| 4 – Tours and popups | pending | |
| 5 – Sidebar icons | pending | |
| 6 – Mobile navigation | pending | |
| 7 – Safety net + data toggle | pending | |
| 8 – Deployment | pending | |
| Final verification + push | pending | |

## Notes
- `Backend code/` was renamed to `backend-reference/`; its .env files were deleted and secrets redacted before the first commit containing it.
- `.env.production` is ignored via `.env.*` / `.env.production`.
- 3 "AIza…" secret-scan hits are base64 image data inside SVGs (false positives).
