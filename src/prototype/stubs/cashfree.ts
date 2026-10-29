// PROTOTYPE-SETUP: stands in for '@cashfreepayments/cashfree-js' (aliased in vite.config.mts). Payments
// are not part of the prototype; checkout resolves with an error result instead of loading Cashfree's SDK.
const PAYMENTS_DISABLED = { message: 'Payments are disabled in this prototype.' };

export const load = async () => ({
    checkout: async () => ({ error: PAYMENTS_DISABLED }),
    create: () => ({ mount: () => undefined, on: () => undefined, destroy: () => undefined }),
});

export default { load };
