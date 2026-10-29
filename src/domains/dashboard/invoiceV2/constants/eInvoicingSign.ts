import instantRegistrationIcon from '../assets/icons/eInvoice/instant-registration.svg';
import legallyValidIcon from '../assets/icons/eInvoice/legally-valid.svg';
import seamlessItcIcon from '../assets/icons/eInvoice/seamless-itc.svg';
import tamperProofIcon from '../assets/icons/eInvoice/tamper-proof.svg';
import { EInvoiceFeature, EInvoiceSignInValues } from '../types/eInvoicingSign';

export const eInvoiceSignInInitialValues: EInvoiceSignInValues = {
    gstin: '',
    clientId: '',
    password: '',
};

export const E_INVOICE_FEATURES: EInvoiceFeature[] = [
    {
        id: 'legally-valid',
        title: 'Legally Valid',
        description: 'IRN-stamped invoices are legally recognized by the GST Council across India.',
        icon: legallyValidIcon,
    },
    {
        id: 'instant-registration',
        title: 'Instant Registration',
        description:
            'Generate a unique Invoice Reference Number (IRN) in seconds directly from the GST portal.',
        icon: instantRegistrationIcon,
    },
    {
        id: 'seamless-itc',
        title: 'Seamless ITC',
        description: 'Buyers automatically get Input Tax Credit — no manual reconciliation needed.',
        icon: seamlessItcIcon,
    },
    {
        id: 'tamper-proof',
        title: 'Tamper-Proof',
        description:
            'Every e-invoice is digitally signed and QR-coded, making it fraud-proof and audit-ready.',
        icon: tamperProofIcon,
    },
];
