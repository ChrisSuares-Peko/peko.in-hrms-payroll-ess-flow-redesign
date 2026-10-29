export type TransactionType = 'Income' | 'Expense';

export type TransactionStatus = 'needs-review' | 'matched' | 'recurring' | 'hidden';

export interface TransactionCategory {
    label: string;

    confidence?: number;

    suggested?: boolean;
}

export interface TransactionLinkRef {
    id: number;
    targetType: string;
    targetId: number;
}

export interface TransactionDocumentRef {
    id: number;
    name: string;
    url: string;
}

export interface Transaction {
    id: string;

    date: string;
    description: string;

    recurring?: boolean;

    note?: string;
    category: TransactionCategory;

    amount: number;
    type: TransactionType;

    account: string;

    invoiceNo?: string;

    links?: TransactionLinkRef[];

    documents?: TransactionDocumentRef[];
    statuses: TransactionStatus[];
}

export interface TransactionMonthGroup {
    month: string;
    transactions: Transaction[];
}

export interface TransactionTab {
    key: 'all' | TransactionStatus;
    label: string;
}

export interface TransactionFilters {
    type?: string;
    categories?: string[];

    status?: string;

    sources?: string[];
    bankAccounts?: string[];

    from?: string | null;
    to?: string | null;
}

export interface TransactionsHeaderContent {
    title: string;
    subtitle: string;
}

export const TRANSACTION_GRID_COLS = 'grid-cols-transactions';

export const transactionsHeader: TransactionsHeaderContent = {
    title: 'Transactions',
    subtitle: 'Manage all financial transactions',
};

export const transactionTabs: TransactionTab[] = [
    { key: 'all', label: 'All' },
    { key: 'needs-review', label: 'Needs Review' },
    { key: 'matched', label: 'Matched' },
    { key: 'recurring', label: 'Recurring' },
    { key: 'hidden', label: 'Hidden' },
];

export const transactionColumns: string[] = [
    '',
    'Date',
    'Description',
    'Category',
    'Amount',
    'Type',
    'Category',
    'Docs',
    'Action',
];

export const accountOptions = [
    { label: 'Bank', value: 'Bank' },
    { label: 'Upload', value: 'Upload' },
    { label: 'Manual', value: 'Manual' },
];

export const manageTransactionOptions = [
    { label: 'Create Invoice', value: 'create-invoice' },
    { label: 'Add Purchase Bill', value: 'add-purchase-bill' },
    { label: 'Add Transaction via Receipt', value: 'add-via-receipt' },
    { label: 'Import Transactions', value: 'import-transactions' },
];

export const addTransactionModal = {
    title: 'Add Transaction via Receipt',
    subtitle: 'Upload a receipt and fill in the transaction details',
    receiptLabel: 'Receipt (optional)',
    uploadCta: 'Upload from your device',
    uploadHint: 'PDF, JPG, PNG, Excel. Max 10MB',
    uploadAccept: '.jpg,.jpeg,.png,.pdf,.xls,.xlsx',
    descriptionPlaceholder: 'Enter payment description or notes...',
    descriptionMaxLength: 200,
};

export interface ImportTransactionsContent {
    title: string;
    subtitle: string;
    uploadCta: string;
    uploadHint: string;
    uploadAccept: string;
    expectedColumnsTitle: string;
    expectedColumns: string[];
    templateTitle: string;
    templateSubtitle: string;
    templateCta: string;
    submitLabel: string;
}

export const importTransactionsModal: ImportTransactionsContent = {
    title: 'Import Transactions',
    subtitle: 'Upload a CSV or Excel file to bulk import transactions',
    uploadCta: 'Upload from your device',
    uploadHint: 'CSV, XLS or XLSX — max 10MB',
    uploadAccept: '.csv,.xls,.xlsx',
    expectedColumnsTitle: 'Expected columns',
    expectedColumns: [
        'Date (DD/MM/YYYY)',
        'Description',
        'Amount',
        'Type (income / expense)',
        'Category (optional)',
    ],
    templateTitle: 'Download Import Template',
    templateSubtitle: 'Pre-formatted CSV with all required columns',
    templateCta: 'Download',
    submitLabel: 'Add transactions',
};

export interface CategoryOption {
    label: string;
    value: string;
}

export const transactionCategoryOptions: CategoryOption[] = [
    { label: 'Sales Revenue', value: 'sales' },
    { label: 'Rent', value: 'rent' },
    { label: 'Utilities', value: 'utilities' },
    { label: 'Salaries & Wages', value: 'salaries' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Software & Subscriptions', value: 'software' },
    { label: 'Travel', value: 'travel' },
    { label: 'Office Supplies', value: 'office-supplies' },
    { label: 'Professional Fees', value: 'professional-fees' },
    { label: 'Other', value: 'other' },
];

export const transactionSubcategoryOptions: Record<string, CategoryOption[]> = {
    sales: [
        { label: 'Product Sales', value: 'product-sales' },
        { label: 'Service Income', value: 'service-income' },
        { label: 'Other Income', value: 'other-income' },
    ],
    rent: [
        { label: 'Office Rent', value: 'office-rent' },
        { label: 'Warehouse Rent', value: 'warehouse-rent' },
        { label: 'Equipment Rent', value: 'equipment-rent' },
    ],
    utilities: [
        { label: 'Electricity', value: 'electricity' },
        { label: 'Water', value: 'water' },
        { label: 'Internet & Phone', value: 'internet' },
    ],
    salaries: [
        { label: 'Full-time', value: 'full-time' },
        { label: 'Contract', value: 'contract' },
        { label: 'Bonus', value: 'bonus' },
    ],
    marketing: [
        { label: 'Digital Ads', value: 'digital-ads' },
        { label: 'Events', value: 'events' },
        { label: 'Content', value: 'content' },
    ],
    software: [
        { label: 'SaaS Tools', value: 'saas' },
        { label: 'Cloud Hosting', value: 'cloud' },
        { label: 'Licenses', value: 'licenses' },
    ],
    travel: [
        { label: 'Flights', value: 'flights' },
        { label: 'Hotels', value: 'hotels' },
        { label: 'Local Transport', value: 'local-transport' },
    ],
    'office-supplies': [
        { label: 'Stationery', value: 'stationery' },
        { label: 'Equipment', value: 'equipment' },
        { label: 'Furniture', value: 'furniture' },
    ],
    'professional-fees': [
        { label: 'Legal', value: 'legal' },
        { label: 'Accounting', value: 'accounting' },
        { label: 'Consulting', value: 'consulting' },
    ],
    other: [{ label: 'Miscellaneous', value: 'misc' }],
};

export const filterTransactionTypeOptions: CategoryOption[] = [
    { label: 'All', value: 'all' },
    { label: 'Income', value: 'income' },
    { label: 'Expense', value: 'expense' },
];

export const filterStatusOptions: CategoryOption[] = [
    { label: 'All', value: 'all' },
    { label: 'Categorized', value: 'categorized' },
    { label: 'Needs Review', value: 'needs-review' },
];

export const filterCategoryOptions: string[] = [
    'Revenue',
    'Marketing',
    'Software',
    'Travel',
    'Food',
    'Office',
    'Salary',
    'Tax',
];

export const filterSourceOptions: string[] = ['Bank', 'Upload', 'Manual'];

export const transactionGroups: TransactionMonthGroup[] = [
    {
        month: 'March 2026',
        transactions: [
            {
                id: 'mar-1',
                date: 'Mar 28',
                description: 'NEFT — Raj Spinners Pvt Ltd',
                category: { label: 'Client Payment' },
                amount: 236000,
                type: 'Income',
                account: 'Bank',
                invoiceNo: '238',
                statuses: ['matched'],
            },
            {
                id: 'mar-2',
                date: 'Mar 24',
                description: 'Google Ads India — Campaign Feb',
                recurring: true,
                category: { label: 'AI Digital Ads', confidence: 92, suggested: true },
                amount: 28500,
                type: 'Expense',
                account: 'Bank',
                statuses: ['needs-review', 'recurring'],
            },
            {
                id: 'mar-3',
                date: 'Mar 20',
                description: 'HDFC Bank — Office Rent Mar',
                recurring: true,
                note: 'Paid via NEFT · ref #4421. Lease renews in April.',
                category: { label: 'Rent' },
                amount: 28500,
                type: 'Expense',
                account: 'Bank',
                invoiceNo: '238',
                statuses: ['recurring', 'matched'],
            },
            {
                id: 'mar-4',
                date: 'Mar 18',
                description: 'Swiggy — Office lunch',
                category: { label: 'AI: Team meals', confidence: 92, suggested: true },
                amount: 28500,
                type: 'Expense',
                account: 'Bank',
                statuses: ['needs-review'],
            },
            {
                id: 'mar-5',
                date: 'Mar 12',
                description: 'AWS India — Cloud Hosting',
                recurring: true,
                category: { label: 'Software & Subscriptions' },
                amount: 41200,
                type: 'Expense',
                account: 'Manual',
                invoiceNo: '241',
                statuses: ['recurring', 'matched'],
            },
        ],
    },
    {
        month: 'February 2026',
        transactions: [
            {
                id: 'feb-1',
                date: 'Feb 26',
                description: 'NEFT — Raj Spinners Pvt Ltd',
                category: { label: 'Client Payment' },
                amount: 236000,
                type: 'Income',
                account: 'Bank',
                invoiceNo: '238',
                statuses: ['matched'],
            },
            {
                id: 'feb-2',
                date: 'Feb 22',
                description: 'Google Ads India — Campaign Jan',
                recurring: true,
                category: { label: 'AI Digital Ads', confidence: 92, suggested: true },
                amount: 28500,
                type: 'Expense',
                account: 'Bank',
                statuses: ['needs-review', 'recurring'],
            },
            {
                id: 'feb-3',
                date: 'Feb 20',
                description: 'HDFC Bank — Office Rent Feb',
                recurring: true,
                note: 'Paid via NEFT · ref #4391.',
                category: { label: 'Rent' },
                amount: 28500,
                type: 'Expense',
                account: 'Bank',
                invoiceNo: '236',
                statuses: ['recurring', 'matched'],
            },
            {
                id: 'feb-4',
                date: 'Feb 14',
                description: 'Razorpay — Settlement',
                category: { label: 'AI: Client Payment', confidence: 88, suggested: true },
                amount: 112400,
                type: 'Income',
                account: 'Bank',
                statuses: ['needs-review'],
            },
            {
                id: 'feb-5',
                date: 'Feb 08',
                description: 'Zoho — Annual Plan',
                category: { label: 'Software & Subscriptions' },
                amount: 18900,
                type: 'Expense',
                account: 'Manual',
                statuses: ['hidden'],
            },
        ],
    },
];
