const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise: Promise<boolean> | null = null;

export const loadRazorpayScript = (): Promise<boolean> => {
    // PROTOTYPE-SETUP: payments are out of scope; never load Razorpay's checkout script (callers treat false as unavailable).
    if (RAZORPAY_SCRIPT_URL) return Promise.resolve(false);
    if (window.Razorpay) return Promise.resolve(true);
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise<boolean>(resolve => {
        const script = document.createElement('script');
        script.src = RAZORPAY_SCRIPT_URL;
        script.async = true;
        script.onload = () => {
            // Loaded but no global (blocked/altered script): allow a retry on the next click.
            if (!window.Razorpay) scriptPromise = null;
            resolve(Boolean(window.Razorpay));
        };
        script.onerror = () => {
            scriptPromise = null;
            resolve(false);
        };
        document.body.appendChild(script);
    });
    return scriptPromise;
};

export type RazorpaySuccess = {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
};

export type RazorpayCheckoutResult =
    | { success: RazorpaySuccess }
    | { dismissed: true }
    | { error: unknown };

type OpenRazorpayCheckoutOptions = {
    keyId: string;
    amount: number; // rupees — converted to paise here
    currency: string;
    razorpayOrderId: string;
    description?: string;
    prefill?: { name?: string; email?: string; contact?: string };
    notes?: Record<string, string>;
    onFailed?: (error: unknown) => void;
};

// Resolves once: on success (handler) or when the customer closes the modal. A failed
// attempt keeps the modal open for retry, so it only reaches onFailed.
export const openRazorpayCheckout = (opts: OpenRazorpayCheckoutOptions) =>
    new Promise<RazorpayCheckoutResult>(resolve => {
        let settled = false;
        const settle = (result: RazorpayCheckoutResult) => {
            if (settled) return;
            settled = true;
            resolve(result);
        };
        // A bad key / blocked script throws synchronously here; never leave the caller hanging.
        try {
            const rzp = new window.Razorpay({
                key: opts.keyId,
                amount: Math.round(opts.amount * 100),
                currency: opts.currency,
                order_id: opts.razorpayOrderId,
                name: 'Peko',
                description: opts.description,
                prefill: opts.prefill,
                notes: opts.notes,
                retry: { enabled: true },
                handler: (response: RazorpaySuccess) => settle({ success: response }),
                modal: { ondismiss: () => settle({ dismissed: true }) },
            });
            rzp.on('payment.failed', (response: { error: unknown }) =>
                opts.onFailed?.(response?.error)
            );
            rzp.open();
        } catch (error) {
            settle({ error });
        }
    });
