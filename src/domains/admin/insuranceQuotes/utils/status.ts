import { QuoteRequestStatus } from '../types/quoteRequests';

export const STATUS_META: Record<QuoteRequestStatus, { label: string; color: string }> = {
    NEW: { label: 'New', color: 'blue' },
    CONTACTED: { label: 'Contacted', color: 'gold' },
    QUOTED: { label: 'Quoted', color: 'purple' },
    CONVERTED: { label: 'Converted', color: 'green' },
    CLOSED: { label: 'Closed', color: 'red' },
};

export const STATUS_OPTIONS = (Object.keys(STATUS_META) as QuoteRequestStatus[]).map(value => ({
    value,
    label: STATUS_META[value].label,
}));
