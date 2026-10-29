import { UserPayload } from '@customtypes/general';

import { getAllDocuments } from './documents';
import { CreditNoteRow } from '../types/creditNote';

export const getAllCreditNotesApi = async (
    payload: UserPayload & { linkedInvoiceId?: string | number }
) => {
    const result = await getAllDocuments({ ...payload, documentType: 'CREDIT_NOTE' } as any);
    if (!result) return false;

    const creditNotes: CreditNoteRow[] = result.invoiceData.map((inv: any) => {
        const details = inv.creditNoteDetails || {};
        return {
            id: inv.id,
            creditNoteNumber: inv.invoiceNumber,
            prefix: inv.prefix,
            linkedInvoiceId: inv.linkedInvoiceId,
            reason: details.reason || null,
            reasonDetail: details.additionalDetails || null,
            customerName: inv.name,
            customerEmail: inv.email,
            status: inv.status,
            currency: inv.currency || 'INR',
            totalAmount: inv.totalAmount,
            amountDue: inv.amountDue,
            issueDate: inv.invoiceDate,
            dueDate: inv.dueDate,
            createdAt: inv.createdAt,
            items: inv.items,
        };
    });

    return { creditNotes, recordsTotal: result.recordsTotal };
};