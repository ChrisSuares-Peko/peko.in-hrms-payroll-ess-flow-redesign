import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getImsSupplierInvoices } from '../api/tax';
import { SupplierSummary } from '../pages/ims/ImsSidebar';
import { ImsSupplierCustomer } from '../types';

interface Params {
    gstin: string;
    financialYear: string;
    month: number;
    search?: string;
}

const useImsSupplierData = (params: Params | null) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [customers, setCustomers] = useState<ImsSupplierCustomer[]>([]);
    const [summary, setSummary] = useState<SupplierSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetch = useCallback(async () => {
        if (!params?.gstin || !params?.financialYear || !params?.month) return;
        setIsLoading(true);
        const data = await getImsSupplierInvoices({
            userId: id,
            userType: role,
            gstin: params.gstin,
            financialYear: params.financialYear,
            month: params.month,
            ...(params.search ? { search: params.search } : {}),
        });
        if (data) {
            setCustomers(data.customers ?? []);
            setSummary({
                totalInvoices: data.summary.totalInvoices,
                totalTaxable: data.summary.totalTaxable,
                totalTax: data.summary.totalTax,
                accepted: data.summary.acceptedCount,
                rejected: data.summary.rejectedCount,
                noResponse: data.summary.noResponseCount,
            });
        }
        setIsLoading(false);
    }, [id, role, params?.gstin, params?.financialYear, params?.month, params?.search]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { customers, summary, isLoading };
};

export default useImsSupplierData;
