import {
    createTransactionLinks,
    LinkableInvoice,
    uploadTransactionDocument,
} from '../../api/transactions';
import fileToBase64 from '../../utils/fileToBase64';
import { Transaction } from '../../utils/transactionsData';

interface SubmitToast {
    variant: 'success';
    description: string;
}

interface UploadDocumentArgs {
    userId: number;
    userType: string;
    transaction: Transaction;
    uploadedFile: File;
}

export const submitUploadedDocument = async ({
    userId,
    userType,
    transaction,
    uploadedFile,
}: UploadDocumentArgs): Promise<SubmitToast | null> => {
    const documentBase64 = await fileToBase64(uploadedFile);
    const result = await uploadTransactionDocument({
        userId,
        userType,
        transactionId: transaction.id,
        documentBase64,
        fileName: uploadedFile.name,
        format: (uploadedFile.name.split('.').pop() ?? '').toLowerCase(),
        mimeType: uploadedFile.type,
    });
    if (!result) return null;
    return { variant: 'success', description: 'Document attached to this transaction successfully' };
};

interface LinkInvoicesArgs {
    userId: number;
    userType: string;
    transaction: Transaction;
    selected: Record<string, LinkableInvoice>;
}

export const submitLinkedInvoices = async ({
    userId,
    userType,
    transaction,
    selected,
}: LinkInvoicesArgs): Promise<SubmitToast | null> => {
    const links = Object.values(selected).map(invoice => ({
        targetType: invoice.targetType,
        targetId: invoice.id,
    }));
    if (!links.length) return null;
    const result = await createTransactionLinks({
        userId,
        userType,
        transactionId: transaction.id,
        links,
    });
    if (!result) return null;
    return {
        variant: 'success',
        description: `${links.length} Invoice(s) linked successfully`,
    };
};
