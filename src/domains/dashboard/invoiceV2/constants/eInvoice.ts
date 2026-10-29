import { EInvoiceQuickActionItem, EInvoiceStatConfig, SessionInfo } from '../types/eInvoice';

export const E_INVOICE_STAT_CONFIG: EInvoiceStatConfig[] = [
    { id: 'total', label: 'Total IRNs', bgColor: '#FFF7ED', iconKey: 'total' },
    { id: 'active', label: 'Active IRNs', bgColor: '#EEF2FF', iconKey: 'active' },
    { id: 'cancelled', label: 'Cancelled', bgColor: '#ECFDF5', iconKey: 'cancelled' },
    { id: 'waybill', label: 'E-Waybills', bgColor: '#FAF5FF', iconKey: 'waybill' },
];

export const E_INVOICE_STAT_SUBLABELS: Record<string, string> = {
    total: 'All documents',
    cancelled: 'Last 30 days',
    waybill: 'Active waybills',
};

export const E_INVOICE_QUICK_ACTIONS: EInvoiceQuickActionItem[] = [
    { id: 'generate-irn', title: 'Generate IRN', description: 'New e-invoice' },
    { id: 'e-waybill', title: 'E-Waybill', description: 'Transport link' },
    { id: 'gstin-lookup', title: 'GSTIN Lookup', description: 'Verify GSTIN' },
    { id: 'all-invoices', title: 'All E-Invoices', description: 'View all invoices' },
];

export const DEFAULT_SESSION_INFO: SessionInfo = {
    isActive: true,
    timeLeft: '5h 21m left',
    progressPercent: 90,
    gstin: '29AABCU9603R1ZX',
    clientId: 'PEKO_GSP_001',
    expiresAt: '12:23 am',
};
