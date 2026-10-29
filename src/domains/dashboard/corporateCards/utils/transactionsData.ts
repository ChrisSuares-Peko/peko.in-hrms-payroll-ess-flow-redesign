import {
    AccountingSplit,
    AuditEntry,
    CommentEntry,
    ReceiptFile,
    SelectOption,
    TransactionRow,
} from './types';

/**
 * Static demo data + copy for the admin "Transactions" page. The list + transaction detail + receipts are
 * now API-backed; the copy, filter options, and the accounting/audit/comments panels below remain demo.
 */

/* ------------------------------------------------------------------ *
 * Page copy
 * ------------------------------------------------------------------ */
export const TRANSACTIONS_COPY = {
    title: 'Card Transactions',
    subtitle: 'All card activity across your organization.',
    exportCsv: 'Export CSV',
    gstNote:
        'Amounts are GST-inclusive. Pick IGST for inter-state, or CGST + SGST for intra-state — selecting one of CGST/SGST fills the other automatically.',
    allocationNote: 'Allocated ₹1,240.50 of ₹1,240.50 (must equal total paid)',
} as const;

/* ------------------------------------------------------------------ *
 * List filter options
 * ------------------------------------------------------------------ */
export const STATUS_OPTIONS: SelectOption[] = [
    { label: 'Completed', value: 'Completed' },
    { label: 'Processing', value: 'Processing' },
    { label: 'Declined', value: 'Declined' },
    { label: 'Reversed', value: 'Reversed' },
    { label: 'Refunded', value: 'Refunded' },
];

export const CATEGORY_OPTIONS: SelectOption[] = [
    { label: 'Travel', value: 'Travel' },
    { label: 'Groceries', value: 'Groceries' },
    { label: 'Software', value: 'Software' },
    { label: 'Healthcare', value: 'Healthcare' },
    { label: 'Education', value: 'Education' },
    { label: 'Dining', value: 'Dining' },
    { label: 'Office Supplies', value: 'Office Supplies' },
];

export const CARDHOLDER_OPTIONS: SelectOption[] = [
    { label: 'Tony Stark', value: 'tony-stark' },
    { label: 'Bruce Wayne', value: 'bruce-wayne' },
    { label: 'Reed Richards', value: 'reed-richards' },
    { label: 'Lex Luthor', value: 'lex-luthor' },
];

export const CARD_OPTIONS: SelectOption[] = [
    { label: '**** **** **** 1294', value: '1294' },
    { label: '**** **** **** 9865', value: '9865' },
];

export const COUNTRY_OPTIONS: SelectOption[] = [
    { label: 'India', value: 'india' },
    { label: 'United States', value: 'us' },
    { label: 'United Kingdom', value: 'uk' },
];

/* ------------------------------------------------------------------ *
 * Detail — Accounting split mapping (admin-only panel; no backend yet)
 * ------------------------------------------------------------------ */
export const DEBIT_ACCOUNT_OPTIONS: SelectOption[] = [
    { label: 'Travel & Transport', value: 'travel' },
    { label: 'Software & Subscriptions', value: 'software' },
    { label: 'Office Supplies', value: 'office' },
];

export const GST_OPTIONS: SelectOption[] = [
    { label: '0%', value: '0' },
    { label: '5%', value: '5' },
    { label: '12%', value: '12' },
    { label: '18%', value: '18' },
    { label: '28%', value: '28' },
];

export const ACCOUNTING_SPLITS: AccountingSplit[] = [
    { key: 'split-1', net: '₹1,240.50', gstAmount: '₹1,240.50' },
    { key: 'split-2', net: '₹1,240.50', gstAmount: '₹1,240.50' },
];

/* ------------------------------------------------------------------ *
 * List — dummy transaction rows (fallback when API returns empty)
 * ------------------------------------------------------------------ */
export const DUMMY_TRANSACTIONS: TransactionRow[] = [
    {
        key: 'txn-1',
        cardLast4: '**** **** **** 1294',
        date: '2024-01-12',
        merchant: 'Stark Industries',
        member: 'Tony Stark',
        status: 'Posted',
        approval: 'Approved',
        fee: 0,
        amount: -2500,
        transactionId: 'peko2hvcas',
        category: 'Software',
    },
    {
        key: 'txn-2',
        cardLast4: '**** **** **** 1294',
        date: '2024-02-03',
        merchant: 'Wayne Enterprises',
        member: 'Bruce Wayne',
        status: 'Posted',
        approval: 'Auto-approved',
        fee: 0,
        amount: -790.5,
        transactionId: 'peko2hvcas',
        category: 'Travel',
    },
    {
        key: 'txn-3',
        cardLast4: '**** **** **** 1294',
        date: '2024-03-15',
        merchant: 'Oscorp Technologies',
        member: 'Norman Osborn',
        status: 'Posted',
        approval: 'Auto-approved',
        fee: 0,
        amount: -7240.5,
        transactionId: 'peko2hvcas',
        category: 'Education',
    },
    {
        key: 'txn-4',
        cardLast4: '**** **** **** 1294',
        date: '2024-04-27',
        merchant: 'LexCorp',
        member: 'Lex Luthor',
        status: 'Pending',
        approval: 'Pending',
        fee: 0,
        amount: -5240.5,
        transactionId: 'peko2hvcas',
        category: 'Healthcare',
    },
    {
        key: 'txn-5',
        cardLast4: '**** **** **** 9865',
        date: '2024-05-10',
        merchant: 'IndiGo Airlines',
        member: 'Aarav Sharma',
        status: 'Posted',
        approval: 'Approved',
        fee: 0,
        amount: -1240.5,
        transactionId: 'peko3xfkln',
        category: 'Travel',
    },
    {
        key: 'txn-6',
        cardLast4: '**** **** **** 9865',
        date: '2024-06-02',
        merchant: 'Amazon Web Services',
        member: 'Aarav Sharma',
        status: 'Declined',
        approval: 'Pending',
        fee: 0,
        amount: -15000,
        transactionId: 'peko4ylmop',
        category: 'Software',
    },
];

/* ------------------------------------------------------------------ *
 * Detail — dummy receipts (fallback when API returns empty)
 * ------------------------------------------------------------------ */
export const DUMMY_RECEIPTS: ReceiptFile[] = [
    {
        key: 'r-1',
        id: 1,
        fileName: 'f1-original.pdf',
        date: '2024-01-12',
        uploadedBy: 'Tony Stark',
        mimeType: 'application/pdf',
    },
    {
        key: 'r-2',
        id: 2,
        fileName: 'f2-original.pdf',
        date: '2024-02-03',
        uploadedBy: 'Bruce Wayne',
        mimeType: 'application/pdf',
    },
];

/* ------------------------------------------------------------------ *
 * Detail — Audit trail
 * ------------------------------------------------------------------ */
export const AUDIT_TRAIL: AuditEntry[] = [
    {
        key: 'audit-1',
        date: '2024-01-12',
        actor: 'System',
        action: 'Transaction captured at IndiGo Airlines',
    },
    { key: 'audit-2', date: '2024-01-12', actor: 'System', action: 'Status set to posted' },
    {
        key: 'audit-3',
        date: '2024-01-12',
        actor: 'Admin (Aarav Sharma)',
        action: 'Mapped to QuickBooks across 1 account(s)',
    },
    {
        key: 'audit-4',
        date: '2024-01-12',
        actor: 'Aarav Sharma',
        action: 'Aarav Sharma added a comment',
    },
];

/* ------------------------------------------------------------------ *
 * Detail — Comments
 * ------------------------------------------------------------------ */
export const COMMENTS: CommentEntry[] = [
    {
        key: 'comment-1',
        author: 'John - User',
        role: 'user',
        message: 'Vendor required card payment, no receipts available.',
        timestamp: '02.11.2024 16:06 pm',
    },
    {
        key: 'comment-2',
        author: 'Shyam - Admin',
        role: 'admin',
        message: 'Understood. Proceeding with card receipt as supporting documentation.',
        timestamp: '02.11.2024 16:06 pm',
    },
];
