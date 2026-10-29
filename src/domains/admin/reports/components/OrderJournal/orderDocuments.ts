import {
    OrderDocumentAvailability,
    OrderDocumentRecipient,
    OrderDocumentType,
} from '../../types/orderJournal';

export type OrderDocumentEntry = { docType: OrderDocumentType; label: string };

export const RECIPIENT_LABELS: Record<OrderDocumentRecipient, string> = {
    subscriber: 'To Subscriber',
    vendor: 'To Vendor',
};

export const RECIPIENTS: OrderDocumentRecipient[] = ['subscriber', 'vendor'];

// What each recipient can have, and the label shown on its download link —
// mirrors what invoiceAndReceipt.js actually generates/sends for that recipient.
export const RECIPIENT_DOCS: Record<OrderDocumentRecipient, OrderDocumentEntry[]> = {
    // The subscriber's own invoice is always Peko's platform-fee invoice; "Invoice" is the one
    // issued on behalf of the vendor (markup modes), and the vendor gets a copy of it.
    subscriber: [
        { docType: 'invoice', label: 'Invoice on Platform Fee' },
        { docType: 'planInvoice', label: 'Invoice' },
        { docType: 'receipt', label: 'Receipt' },
    ],
    vendor: [
        { docType: 'invoice', label: 'Invoice on Commission' },
        { docType: 'planInvoice', label: 'Copy of Invoice' },
    ],
};

// Each recipient's own doc list (above) only ever asks for keys that recipient's
// slice of OrderDocumentAvailability actually has — cast past the union so TS
// doesn't require every key on both the subscriber and vendor shapes.
export const listOrderDocuments = (
    documents: OrderDocumentAvailability | undefined,
    recipient: OrderDocumentRecipient
): OrderDocumentEntry[] => {
    const availability = documents?.[recipient] as
        | Partial<Record<OrderDocumentType, boolean>>
        | undefined;
    return RECIPIENT_DOCS[recipient].filter(({ docType }) => !!availability?.[docType]);
};

export const countOrderDocuments = (documents?: OrderDocumentAvailability) =>
    RECIPIENTS.reduce(
        (total, recipient) => total + listOrderDocuments(documents, recipient).length,
        0
    );
