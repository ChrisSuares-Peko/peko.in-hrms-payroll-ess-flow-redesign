export type CommissionInvoiceSource = 'order' | 'manual';

export interface CommissionInvoiceTarget {
    vendorId: number | string;
    source: CommissionInvoiceSource;
    id: string;
}

export interface CommissionInvoiceBilledTo {
    companyName: string;
    address: string;
    state: string;
    gstin: string;
}

export interface CommissionInvoiceState {
    code: string;
    name: string;
}

export interface CommissionInvoiceTaxLine {
    label: string;
    amount: number;
}

export interface CommissionInvoicePlacement {
    placeOfSupply: string;
    taxCase: string;
    taxLines: CommissionInvoiceTaxLine[];
}

export interface CommissionInvoicePreview extends CommissionInvoicePlacement {
    html: string;
}

export interface CommissionInvoiceMatch {
    source: CommissionInvoiceSource;
    id: string;
    vendorId: number;
    vendorName: string | null;
    invoiceNumber: string | null;
    issuedDate: string | null;
    total: number;
}

export interface CommissionInvoiceSend {
    to: string[];
    at: string;
    byId?: number | null;
    byName: string | null;
}

export interface CommissionInvoice extends CommissionInvoicePlacement {
    source: CommissionInvoiceSource;
    id: string;
    vendor: { id: number; name: string; emails: string[] };
    documentTitle: string;
    invoiceNumber: string;
    issuedDate: string | null;
    total: number;
    originalBilledTo: CommissionInvoiceBilledTo;
    billedTo: CommissionInvoiceBilledTo;
    states: CommissionInvoiceState[];
    edited: { at: string | null; byName: string | null } | null;
    sends: CommissionInvoiceSend[];
    html: string;
}
