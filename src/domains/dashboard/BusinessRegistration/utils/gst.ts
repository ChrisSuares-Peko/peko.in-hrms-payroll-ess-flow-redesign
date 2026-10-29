// GST Registration Smart Form (service 79, form 1 — PPOB) field options and
// helpers. Used by the proprietorship post-payment GST steps (Applicant Details,
// Address Details, GST Information). Values mirror the vendor's allowed lists.

const opts = (items: string[]) => items.map(v => ({ label: v, value: v }));

// Section E4 — Applicant Type.
export const APPLICANT_TYPE_OPTIONS = opts([
    'Taxpayer',
    'Tax Deductor',
    'Tax Collector (e-Commerce)',
    'GST Practitioner',
    'Non Resident Taxable Person',
    'United Nation Body',
    'Consulate or Embassy of Foreign Country',
    'Other Notified Person',
    'Non-Resident Online Services Provider',
]);

// Section E4 — Nature of possession of premises.
export const PREMISES_OPTIONS = opts(['Consent', 'Leased', 'Others', 'Own', 'Rented', 'Shared']);

// Vendor salutation enum (strict, trailing periods).
export const GST_SALUTATION_OPTIONS = opts(['Mr.', 'Mrs.', 'Dr.', 'Ms.', 'Miss.', 'Prof.']);

// People relationship roles allowed for a Proprietorship (vendor doc Table 14.2).
export const RELATIONSHIP_OPTIONS = opts(['Proprietor', 'Partner', 'Witness']);

// Section E4 — Nature of Business Activity (multi-select).
export const BUSINESS_ACTIVITY_OPTIONS = opts([
    'Bonded Warehouse',
    'EOU / STP / EHTP',
    'Factory / Manufacturing',
    'Import',
    'Leasing Business',
    'Office / Sale Office',
    'Warehouse / Depot',
    'Export',
    'Supplier of Services',
    'Recipient of Goods or Services',
    'Retail Business',
    'Wholesale Business',
    'Works Contract',
    'Others',
]);

// Rule 14A (Yes/No) + its helper text (verbatim from the vendor UI, Section E4).
export const RULE_14A_OPTIONS = opts(['Yes', 'No']);
export const RULE_14A_HELPER =
    'You may avail option under Rule 14A if the ITC to be passed on is less than or equal to ₹2.5 lakhs per month, otherwise please click on No. Further, to avail said option Aadhaar Authentication is mandatory.';

// Maharashtra-only electricity fields (shown when GST Applying State = Maharashtra).
export const ELECTRICITY_BOARD_OPTIONS = opts([
    'Adani Electricity Mumbai Limited',
    'Maharashtra State Electricity Distribution Co. Ltd',
    'Tata Power',
    'The Brihanmumbai Electric Supply and Transport Undertaking',
    'Torrent Power Limited',
]);

export const isMaharashtra = (state?: string) => /maharashtra/i.test(String(state ?? ''));

// TODO(vendor): HSN/SAC search API (Top 5 Goods & Services) — endpoint
// `gst-amendment/search-hsn-sac` pending. Until wired, the picker stays empty.
export interface HsnSacOption {
    code: string;
    description: string;
    kind: 'HSN' | 'SAC';
}
