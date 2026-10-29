import { AgreementStatus, AgreementStatusCounts } from '../types/agreement';

export interface StatusPill {
    label: string;
    value: AgreementStatus | '';
    bg: string;
    text: string;
    countKey: string;
}

export const AGREEMENT_STATUS_PILLS: StatusPill[] = [
    { label: 'Total', value: '', bg: '#F4F4F5', text: '#42526D', countKey: 'total' },
    { label: 'Draft', value: 'Draft', bg: '#F4F4F5', text: '#42526D', countKey: 'draft' },
    { label: 'Pending', value: 'Pending', bg: '#FFF7ED', text: '#F97316', countKey: 'pending' },
    { label: 'Sent', value: 'Sent', bg: '#FEE2E2', text: '#EF4444', countKey: 'sent' },
    { label: 'Signed', value: 'Signed', bg: '#ECFDF5', text: '#43B75D', countKey: 'signed' },
    // { label: 'Active', value: 'Active', bg: '#ECFDF5', text: '#43B75D', countKey: 'active' },
    // { label: 'Expiring soon', value: 'Expiring soon', bg: '#F4F4F5', text: '#42526D', countKey: 'expiringSoon' },
];

const STATUS_DISPLAY_MAP: Record<string, AgreementStatus> = {
    DRAFT: 'Draft',
    PENDING: 'Pending',
    SENT: 'Sent',
    SIGNED: 'Signed',
    ACTIVE: 'Active',
    EXPIRING_SOON: 'Expiring soon',
};

const STATUS_API_MAP: Record<string, string> = {
    Draft: 'DRAFT',
    Pending: 'PENDING',
    Sent: 'SENT',
    Signed: 'SIGNED',
    Active: 'ACTIVE',
    'Expiring soon': 'EXPIRING_SOON',
};

export const mapAgreementStatus = (raw: string): AgreementStatus =>
    STATUS_DISPLAY_MAP[raw?.toUpperCase()] ?? 'Draft';

export const toApiAgreementStatus = (display: string): string =>
    STATUS_API_MAP[display] ?? display.toUpperCase();

export const AGREEMENT_STATUS_COUNTS_DEFAULT: AgreementStatusCounts = {
    total: 0,
    draft: 0,
    pending: 0,
    sent: 0,
    signed: 0,
    active: 0,
    expiringSoon: 0,
};
