// LOCAL DEV ONLY — set VITE_SKIP_TURBO_SUBSCRIPTION_GATE=true in your own untracked
// .env.development.local to work on Turbo / Vehicle Reports without an active garage
// subscription. It lifts two gates: the SubscriptionPage wrapper on the Turbo dashboard
// (Dashboard.tsx) and the add-on quota block on Search / Add to fleet / Add driver
// (useTurboQuota.ts).
//
// `import.meta.env.DEV` is always false in a production build, so this can never activate
// outside `yarn dev`, even if the flag were accidentally committed to a pipeline env.
// Do NOT remove the gates themselves — flip the flag off instead, and never let this ship
// enabled. Note this is frontend-only: the backend still enforces the entitlement.
export const SKIP_TURBO_SUBSCRIPTION_GATE =
    import.meta.env.DEV && import.meta.env.VITE_SKIP_TURBO_SUBSCRIPTION_GATE === 'true';
