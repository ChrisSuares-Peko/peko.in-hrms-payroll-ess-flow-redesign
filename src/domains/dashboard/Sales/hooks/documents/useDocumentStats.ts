import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getInvoiceStats, getSalesOrderStats, getQuotationStats } from '../../api/documents';
import { DocumentType, InvoiceStats, QuotationStats, SalesOrderStats } from '../../types/documents';

type StatsMap = {
    INVOICE: InvoiceStats;
    SALES_ORDER: SalesOrderStats;
    QUOTATION: QuotationStats;
};

const useDocumentStats = <T extends DocumentType>(documentType: T) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [stats, setStats] = useState<StatsMap[T] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInvoiceStats = async () => {
            setIsLoading(true);
            const data = await getInvoiceStats({ userId: id, userType: role });
            if (data) setStats(data as StatsMap[T]);
            setIsLoading(false);
        };

        const fetchSalesOrderStats = async () => {
            setIsLoading(true);
            const data = await getSalesOrderStats({ userId: id, userType: role });
            if (data) setStats(data as StatsMap[T]);
            setIsLoading(false);
        };

        const fetchQuotationStats = async () => {
            setIsLoading(true);
            const data = await getQuotationStats({ userId: id, userType: role });
            if (data) setStats(data as StatsMap[T]);
            setIsLoading(false);
        };

        if (documentType === 'INVOICE') fetchInvoiceStats();
        else if (documentType === 'SALES_ORDER') fetchSalesOrderStats();
        else if (documentType === 'QUOTATION') fetchQuotationStats();
    }, [id, role, documentType]);

    return { stats, isLoading };
};

export default useDocumentStats;
