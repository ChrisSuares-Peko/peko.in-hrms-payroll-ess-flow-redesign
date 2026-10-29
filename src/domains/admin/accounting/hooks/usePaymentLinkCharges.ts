import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPaymentLinkCharges } from '../api/thirdPartyConfiguration';
import {
    PaymentLinkCharge,
    PaymentLinkChargeRow,
    PaymentLinkChargesFilters,
} from '../types/thirdPartyConfiguration';

const usePaymentLinkCharges = (filters: PaymentLinkChargesFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [defaultCharge, setDefaultCharge] = useState<PaymentLinkCharge | null>(null);
    const [rows, setRows] = useState<PaymentLinkChargeRow[]>([]);
    const [count, setCount] = useState(0);
    const [customCount, setCustomCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        const data = await getPaymentLinkCharges({ userId: id, userType: role, ...filters });
        if (data) {
            setDefaultCharge(data.defaultCharge);
            setRows(data.corporates);
            setCount(data.recordsTotal);
            setCustomCount(data.customTotal);
        } else {
            setDefaultCharge(null);
            setRows([]);
            setCount(0);
            setCustomCount(0);
        }
        setIsLoading(false);
    }, [id, role, filters]);

    useEffect(() => {
        load();
    }, [load]);

    return { defaultCharge, rows, count, customCount, isLoading, refetch: load };
};

export default usePaymentLinkCharges;
