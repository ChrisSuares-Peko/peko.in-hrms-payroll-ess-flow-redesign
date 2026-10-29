import { SubmittedApplication } from '../types/forms';

export type PaymentGateFields = Pick<SubmittedApplication, 'compliance' | 'consent'>;

// Payment is blocked until compliance is cleared (passed/skipped/absent) AND
// consent has been received. Consent applies to every application — the
// `received` check mirrors the consent alerts' own "done" guard, so the gate
// and the on-screen consent card always agree. Shared by the application
// details page (Proceed-to-Pay CTA) and the payment summary page (redirect
// guard).
export function isPaymentBlocked(application: PaymentGateFields): boolean {
    const complianceCleared =
        !application.compliance?.status ||
        ['passed', 'skipped'].includes(application.compliance.status);
    const consentCleared = application.consent?.status === 'received';
    return !complianceCleared || !consentCleared;
}
