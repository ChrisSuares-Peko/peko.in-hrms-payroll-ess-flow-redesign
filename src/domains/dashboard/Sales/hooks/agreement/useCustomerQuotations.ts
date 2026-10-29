import { useCallback, useEffect, useState } from 'react';

import dayjs from 'dayjs';

import { useAppSelector } from '@src/hooks/store';

import { getAllDocuments } from '../../api/documents';
import { QuotationLineItem, QuotationOption } from '../../types/agreement';
import { GetAllDocumentsResponse } from '../../types/documents';

type DocumentRowResponse = GetAllDocumentsResponse['invoiceData'][number] & {
    invoiceDate?: string;
    subtotal?: string;
    tax?: string;
    discount?: string;
    items?: QuotationLineItem[];
};

const useCustomerQuotations = (customerId?: string, searchText?: string) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [quotations, setQuotations] = useState<QuotationOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchQuotations = useCallback(async () => {
        if (!customerId) {
            setQuotations([]);
            return;
        }
        setIsLoading(true);
        const resp = await getAllDocuments({
            userId: id,
            userType: role,
            documentType: 'QUOTATION',
            customerId,
            itemsPerPage: 100,
            ...(searchText && { searchText }),
        });
        if (resp) {
            const rows: QuotationOption[] = (resp.invoiceData as DocumentRowResponse[]).map(
                doc => ({
                    id: String(doc.id),
                    displayId: `${doc.prefix ?? ''}${doc.invoiceNumber}`,
                    customer: doc.name,
                    date: dayjs(doc.invoiceDate ?? doc.createdAt).format('DD MMM YYYY'),
                    amount: parseFloat(doc.totalAmount) || 0,
                    status: doc.status,
                    rawId: Number(doc.id),
                    subtotal: parseFloat(doc.subtotal ?? '0') || 0,
                    tax: parseFloat(doc.tax ?? '0') || 0,
                    discount: parseFloat(doc.discount ?? '0') || 0,
                    items: doc.items ?? [],
                })
            );
            setQuotations(rows);
        }
        setIsLoading(false);
    }, [id, role, customerId, searchText]);

    useEffect(() => {
        fetchQuotations();
    }, [fetchQuotations]);

    return { quotations, isLoading };
};

export default useCustomerQuotations;
