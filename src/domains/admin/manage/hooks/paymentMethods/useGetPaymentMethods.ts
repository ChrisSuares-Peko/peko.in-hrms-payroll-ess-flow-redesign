import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPaymentMethodsApi } from '../../api/paymentMethods';
import {
    FilterType,
    PaymentMethod,
    PaymentMethodsResponse,
    PaymentMethodsState,
} from '../../types/paymentMethods';

export default function useGetPaymentMethods(filter: FilterType) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [globalSettings, setGlobalSettings] = useState<PaymentMethodsState | null>(null);
    const [tableData, setTableData] = useState<PaymentMethod[]>([]);
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const latestRequestRef = useRef(0);

    const fetchPaymentMethods = useCallback(
        async (inPlace = false) => {
            latestRequestRef.current += 1;
            const requestId = latestRequestRef.current;
            if (!inPlace) setIsLoading(true);

            const response: PaymentMethodsResponse | false = await getPaymentMethodsApi({
                userId: id,
                userType: role,
                ...filter,
            });
            if (requestId !== latestRequestRef.current) return;

            if (response) {
                setGlobalSettings(response.paymentMethods);
                setTableData(response.data.rows);
                setCount(response.data.recordsTotal);
            }
            setIsLoading(false);
        },
        [id, role, filter]
    );

    useEffect(() => {
        fetchPaymentMethods();
    }, [fetchPaymentMethods]);

    const reload = useCallback(() => {
        fetchPaymentMethods();
    }, [fetchPaymentMethods]);

    const refetchRowsInPlace = useCallback(() => {
        fetchPaymentMethods(true);
    }, [fetchPaymentMethods]);

    return { globalSettings, tableData, count, isLoading, reload, refetchRowsInPlace };
}
