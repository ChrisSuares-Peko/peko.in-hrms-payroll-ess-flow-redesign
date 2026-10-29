export const uploadModal = {
    title: 'Upload Bank Statement',
    dropTitle: 'Drag and drop your file here',
    orPrefix: 'Or',
    browse: 'browse your file',
    formatsHint: 'PDF only',
    worksWithLabel: 'Works with statements from',
    securityNote: 'Max file size: 10 MB · Your data is encrypted and never shared',

    accept: '.pdf',
    allowedExtensions: ['pdf'],
    mimeTypesByExtension: {
        pdf: 'application/pdf',
    } as Record<string, string>,
    maxSizeMb: 10,
    invalidFileMessage: 'Please upload a PDF file under 10 MB.',
    cancelLabel: 'Cancel',
    continueLabel: 'Continue',
};

export const supportedBanks: string[] = [
    'HDFC',
    'ICICI',
    'SBI',
    'Axis',
    'Kotak',
    'Yes Bank',
    'IndusInd',
    '+more',
];

export interface TransactionCategory {
    value: string;
    label: string;
}

export const transactionCategories: TransactionCategory[] = [
    { value: 'sales-revenue', label: 'Sales Revenue' },
    { value: 'office-supplies', label: 'Office Supplies' },
    { value: 'rent', label: 'Rent' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'salaries', label: 'Salaries' },
    { value: 'professional-fees', label: 'Professional Fees' },
    { value: 'bank-charges', label: 'Bank Charges' },
    { value: 'gst-payment', label: 'GST Payment' },
    { value: 'uncategorized', label: 'Uncategorized' },
];

export type TransactionStatus = 'clean' | 'warning' | 'error';

export interface SampleTransaction {
    id: string;
    date: string;
    description: string;

    category: string;

    amount: number;
    status: TransactionStatus;

    note?: string;
}

export const sampleTransactions: SampleTransaction[] = [
    {
        id: 'txn-1',
        date: 'Mar 01',
        description: 'NEFT — Raj Spinners Pvt Ltd',
        category: 'sales-revenue',
        amount: 236000,
        status: 'clean',
    },
    {
        id: 'txn-2',
        date: 'Mar 03',
        description: 'UPI — Office Mart Supplies',
        category: 'office-supplies',
        amount: -8450,
        status: 'clean',
    },
    {
        id: 'txn-3',
        date: 'Mar 06',
        description: 'NEFT — Verma Traders',
        category: '',
        amount: 142500,
        status: 'error',
        note: 'Category missing',
    },
];

export interface QualityChip {
    key: TransactionStatus;
    label: string;
    bg: string;
    border: string;
    color: string;
}

export const dataQuality = {
    score: 80,
    label: 'Data Quality',
    capturedLabel: '15 transactions captured · HDFC Current A/C',
    counts: { clean: 12, warning: 2, error: 1 },
    chips: [
        { key: 'clean', label: 'Clean', bg: '#ECFDF5', border: '#81CF92', color: '#43B75D' },
        { key: 'warning', label: 'Warning', bg: '#FFFBEB', border: '#FCD34D', color: '#F59E0B' },
        { key: 'error', label: 'Error', bg: '#FEF2F2', border: '#FF4F4F', color: '#FF4F4F' },
    ] as QualityChip[],
    aiNote: {
        prefix: 'AI has auto-categorized ',
        highlight: '12 transactions',
        suffix: '. Review and fix remaining below.',
    },
    totalCount: 15,
    categorizedCount: 12,
};

export type CategorizeTab = 'all' | 'issues';

export const categorize = {
    columns: ['Date', 'Description', 'Category', 'Amount'],
    currencySymbol: '₹',
    tabs: [
        { key: 'all', label: `All (${dataQuality.totalCount})` },
        {
            key: 'issues',
            label: `Issues only (${dataQuality.counts.warning + dataQuality.counts.error})`,
        },
    ] as { key: CategorizeTab; label: string }[],
    showingLabel: `Showing ${dataQuality.totalCount} of ${dataQuality.totalCount} transactions`,
    categorizedLabel: `${dataQuality.categorizedCount}/${dataQuality.totalCount} categorized`,
};

export interface ImportStat {
    key: string;
    label: string;
    value: string;
    caption: string;

    bg: string;
}

export const importedSummary = {
    title: 'Transactions Imported!',
    account: 'HDFC Current Account · Mar 1 – Mar 31, 2026',
    subtitle: 'Your ledger has been updated and is ready to review.',
    stats: [
        {
            key: 'imported',
            label: 'Total imported',
            value: '47',
            caption: 'Transactions',
            bg: '#FDF6F0',
        },
        {
            key: 'credits',
            label: 'Total credits',
            value: '₹6.8L',
            caption: '28 Transactions',
            bg: '#ECF0FC',
        },
        {
            key: 'debits',
            label: 'Total debits',
            value: '₹6.8L',
            caption: '28 Transactions',
            bg: '#EBF6F1',
        },
        {
            key: 'categorized',
            label: 'Categorized',
            value: '93%',
            caption: '44 of 47',
            bg: '#FCF9FF',
        },
    ] as ImportStat[],
    reviewBanner: {
        title: 'Ready for review in Transactions',
        description: 'Categorize, attach documents, and manage your imported entries.',
    },
    uploadAnotherLabel: 'Upload another',
    viewTransactionsLabel: 'View Transactions',
};
