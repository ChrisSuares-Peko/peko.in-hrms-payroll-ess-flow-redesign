export type ExportStatus = 'Unexported' | 'Exported';

export interface CardTxnRow {
    key: string;
    date: string;
    merchant: string;
    member: string;
    amount: number;
    fee: number;
    status: ExportStatus;
}

export interface ReimbursementExportRow {
    key: string;
    date: string;
    member: string;
    merchant: string;
    description: string;
    amount: number;
    status: ExportStatus;
}

export interface VendorInvoiceExportRow {
    key: string;
    invoice: string;
    issued: string;
    due: string;
    amount: number;
    status: ExportStatus;
}

export interface WalletTopupRow {
    key: string;
    date: string;
    reference: string;
    amount: number;
    source: string;
    status: ExportStatus;
}

export const CARD_TXN_ROWS: CardTxnRow[] = [
    {
        key: '1',
        date: '2024-01-12',
        merchant: 'Stark Industries',
        member: 'Tony Stark',
        amount: -2500,
        fee: -18.6,
        status: 'Unexported',
    },
    {
        key: '2',
        date: '2024-02-03',
        merchant: 'Wayne Enterprises',
        member: 'Bruce Wayne',
        amount: -790.5,
        fee: -36,
        status: 'Exported',
    },
    {
        key: '3',
        date: '2024-03-15',
        merchant: 'Oscorp Technologies',
        member: 'Reed Richards',
        amount: -7240.5,
        fee: 0,
        status: 'Unexported',
    },
    {
        key: '4',
        date: '2024-04-27',
        merchant: 'LexCorp',
        member: 'Lex Luthor',
        amount: -5240.5,
        fee: -36,
        status: 'Unexported',
    },
];

export const REIMBURSEMENT_EXPORT_ROWS: ReimbursementExportRow[] = [
    {
        key: '1',
        date: '2024-01-12',
        member: 'Tony Stark',
        merchant: 'Auto Rickshaw',
        description: 'Client meeting transport',
        amount: 2500,
        status: 'Unexported',
    },
    {
        key: '2',
        date: '2024-02-03',
        member: 'Bruce Wayne',
        merchant: 'Bombay Print Hub',
        description: 'Conference materials',
        amount: 790.5,
        status: 'Exported',
    },
    {
        key: '3',
        date: '2024-03-15',
        member: 'Reed Richards',
        merchant: 'Bukhara',
        description: 'Client dinner',
        amount: 7240.5,
        status: 'Unexported',
    },
    {
        key: '4',
        date: '2024-04-27',
        member: 'Lex Luthor',
        merchant: 'Parking Plaza',
        description: 'Off-site meeting parking',
        amount: 5240.5,
        status: 'Unexported',
    },
];

export const VENDOR_INVOICE_EXPORT_ROWS: VendorInvoiceExportRow[] = [
    {
        key: '1',
        invoice: 'INV-2024-1042',
        issued: '15 Oct 2024',
        due: '14 Nov 2024',
        amount: 2500,
        status: 'Unexported',
    },
    {
        key: '2',
        invoice: 'INV-2024-1043',
        issued: '25 Oct 2024',
        due: '24 Nov 2024',
        amount: 790.5,
        status: 'Exported',
    },
    {
        key: '3',
        invoice: 'INV-2024-1044',
        issued: '12 Oct 2024',
        due: '22 Nov 2024',
        amount: 7240.5,
        status: 'Unexported',
    },
    {
        key: '4',
        invoice: 'INV-2024-1045',
        issued: '11 Oct 2024',
        due: '11 Nov 2024',
        amount: 5240.5,
        status: 'Unexported',
    },
];

export const WALLET_TOPUP_ROWS: WalletTopupRow[] = [
    {
        key: '1',
        date: '2024-01-12',
        reference: 'NEFT-OCT-001',
        amount: 2500,
        source: 'HDFC Bank ****4521',
        status: 'Unexported',
    },
    {
        key: '2',
        date: '2024-02-03',
        reference: 'RTGS-SEP-002',
        amount: 790.5,
        source: 'HDFC Bank ****4521',
        status: 'Exported',
    },
    {
        key: '3',
        date: '2024-03-15',
        reference: 'IMPS-NOV-003',
        amount: 7240.5,
        source: 'HDFC Bank ****4521',
        status: 'Unexported',
    },
    {
        key: '4',
        date: '2024-04-27',
        reference: 'UPI-DEC-004',
        amount: 5240.5,
        source: 'HDFC Bank ****4521',
        status: 'Unexported',
    },
];

export const ACCOUNT_OPTIONS = [
    { value: '1000', label: '1000 · Cash' },
    { value: '2000', label: '2000 · Accounts Payable' },
    { value: '5000', label: '5000 · Expenses' },
    { value: '5090', label: '5090 · Bank & Card Fees' },
];

export const GST_OPTIONS = [
    { value: 'none', label: 'None' },
    { value: '5', label: '5%' },
    { value: '12', label: '12%' },
    { value: '18', label: '18%' },
    { value: '28', label: '28%' },
];

export const PLACE_OPTIONS = [
    { value: 'MH', label: 'Maharashtra' },
    { value: 'DL', label: 'Delhi' },
    { value: 'KA', label: 'Karnataka' },
    { value: 'TN', label: 'Tamil Nadu' },
];
