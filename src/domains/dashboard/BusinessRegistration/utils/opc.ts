// Constants for the OPC Shareholding step (Figma 1848:29302).

import { EntityType } from '../types';

export const AUTHORIZED_CAPITAL_OPTIONS = [100000, 500000, 1000000].map(v => ({
    label: `₹${v.toLocaleString('en-IN')}`,
    value: v,
}));

export const FACE_VALUE_OPTIONS = [1, 10, 100].map(v => ({ label: `₹${v}`, value: v }));

export const PAID_UP_COMPLIANCE_NOTE =
    "The paid-up capital must be deposited into the company's bank account within 6 months of incorporation, and the Certificate of Business (COB / INC-20A) filed. Failure to do so attracts penalties and may lead to the company being struck off.";

// Entity-specific so the note never contradicts the entity's own shareholder
// rule (Pvt Ltd needs 2+, OPC exactly 1) — the Shareholding step is shared.
export const capitalUnderstandingNotes = (entityType?: string) => [
    'Authorized Capital: Maximum capital the company can raise — minimum ₹1,00,000; government stamp duty applies on amounts above ₹1,00,000',
    'Paid-up Capital: Actual capital issued now — can be equal to or less than the authorized capital',
    'Face Value: Nominal value of each share',
    'Every paid-up share must be allotted; the remaining authorized shares can be issued later',
    entityType === EntityType.OPC
        ? 'OPC: exactly 1 shareholder'
        : 'Private Limited: 2–200 shareholders',
    'Corporate/legal-entity shareholders must upload their incorporation certificate',
    'Paid-up capital to be deposited in the bank within 6 months & COB (INC-20A) filed',
];

export const formatINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;
