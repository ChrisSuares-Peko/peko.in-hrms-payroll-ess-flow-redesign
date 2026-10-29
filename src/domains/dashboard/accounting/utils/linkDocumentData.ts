export type LinkDocumentTabKey = 'invoice' | 'purchase-bills' | 'peko-hub';

export interface LinkDocumentTab {
    key: LinkDocumentTabKey;
    label: string;
}

export interface LinkableDocument {
    id: string;

    reference: string;

    party: string;

    date: string;
    amount: number;

    status: string;
}

export const linkDocumentTabs: LinkDocumentTab[] = [
    { key: 'invoice', label: 'Invoice' },
    { key: 'purchase-bills', label: 'Purchase Bills' },
    { key: 'peko-hub', label: 'Peko Hub' },
];

export const linkDocumentCopy = {
    title: 'Link Document',
    description: 'Select a document to link to this transaction.',
    searchInvoices: 'Search invoices',
    uploadTitle: 'Upload from your device',
    uploadHint: 'PDF, JPG, PNG, Excel. Max 10MB',
    emptyInvoices: 'No invoices found',
    billsComingSoon: 'Purchase Bill linking is coming soon.',

    uploadAccept: '.pdf,.jpg,.jpeg,.png,.xls,.xlsx',
};
