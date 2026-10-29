import { PurchaseRequestLineItem } from '@src/domains/dashboard/Procure/types';

export type LineItem = Required<Pick<PurchaseRequestLineItem, 'key'>> & Omit<PurchaseRequestLineItem, 'key'>;

export interface NewAttachment {
    fileName: string;
    fileBase64: string;
    fileFormat: string;
}

export const defaultLineItem = (): LineItem => ({
    key: String(Date.now() + Math.random()),
    itemName: '',
    description: '',
    qty: 1,
    unit: 'Unit',
    estUnitCost: '',
});

export const emptyValues = {
    requestedBy: '',
    department: '',
    category: '',
    neededBy: '',
    lineItems: [defaultLineItem()] as LineItem[],
    notes: '',
    newAttachments: [] as NewAttachment[],
    deletedAttachmentFileNames: [] as string[],
};

export type FormValues = typeof emptyValues;

export const buildPayload = (values: FormValues, status: 'Open' | 'Draft') => {
    const estimatedBudget = values.lineItems.reduce(
        (sum, i) => sum + Number(i.qty) * Number(i.estUnitCost), 0
    );
    const description = values.lineItems.map(i => i.itemName).filter(Boolean).join(', ') || '-';
    return {
        requestedBy: values.requestedBy || undefined,
        department: values.department,
        category: values.category,
        description,
        estimatedBudget,
        currency: 'INR',
        neededBy: values.neededBy ? `${values.neededBy}T00:00:00.000Z` : undefined,
        notes: values.notes || undefined,
        attachments: values.newAttachments.length ? values.newAttachments : undefined,
        deletedAttachments: values.deletedAttachmentFileNames.length ? values.deletedAttachmentFileNames : undefined,
        lineItems: values.lineItems.filter(i => i.itemName).map(({ key: _key, ...rest }) => rest),
        status,
    };
};
