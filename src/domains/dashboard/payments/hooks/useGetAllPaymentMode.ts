import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';
import { isServiceGatewayEnabled } from '@utils/ccavenueServices';

import { fetchAvailablePgMethods } from '../api';
import { PaymentMethodsResponse } from '../types';

const useGetAllPaymentMode = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isPgOptionsLoading, setIsLoading] = useState(true);
    const [isPgDown, setIsPgDown] = useState(true);
    const { refresh } = useAppSelector(state => state.reducer.address);
    const [availablePgOptions, setAvailablePgOptions] = useState<PaymentMethodsResponse>({
        gateway: {
            available: false,
            limits: {
                limitPerTransaction: 0,
                limitPerDay: 0,
                limitPerMonth: 0,
            },
            usage: {
                today: 0,
                month: 0,
            },
        },
        wallet: {
            available: false,
            limits: {
                limitPerTransaction: 0,
                limitPerDay: 0,
                limitPerMonth: 0,
            },
            usage: {
                today: 0,
                month: 0,
            },
        },
        isCouponApplicable: false,
    });
    const payloadAccessKey = useAppSelector(state => state.reducer.payment.payload?.accessKey);
    const payloadBillerId = useAppSelector(state => state.reducer.payment.payload?.billerId);
    const payloadOrderGroups = useAppSelector(state => (state.reducer.payment.payload as any)?.orderGroups);

    const getPaymentMethods = useCallback(async () => {
        setIsLoading(true);

        // Mixed-vendor (esim orderGroups) has no top-level accessKey — use eSim key for PG method lookup
        const resolvedAccessKey =
            payloadAccessKey ??
            (Array.isArray(payloadOrderGroups) ? 'esim' : undefined);

        if (!resolvedAccessKey) {
            setIsLoading(false);
            return;
        }
        const fetchParams: any = {
            userId: id,
            userType: role,
            accessKey: resolvedAccessKey,
        };
        if (payloadBillerId) {
            fetchParams.billerId = payloadBillerId;
        }
        const data: PaymentMethodsResponse | false = await fetchAvailablePgMethods(fetchParams);

        console.log('[PG Methods] fetchParams:', fetchParams);
        console.log('[PG Methods] response:', data);

        if (data) {
            const isGatewayAvailable =
                data.gateway.available &&
                isServiceGatewayEnabled(
                    resolvedAccessKey,
                    data.gateway.providers,
                    data.gateway.provider
                );
            setAvailablePgOptions({
                ...data,
                gateway: { ...data.gateway, available: isGatewayAvailable },
            });

            const allFalse =
                !isGatewayAvailable &&
                !data.wallet.available &&
                !data.corporateCard?.available;
            console.log('[PG Methods] gateway.available:', data.gateway.available, '| wallet.available:', data.wallet.available, '| isPgDown:', allFalse);
            setIsPgDown(allFalse);
        }
        setIsLoading(false);
    }, [id, payloadAccessKey, payloadBillerId, payloadOrderGroups, role]);

    useEffect(() => {
        getPaymentMethods();
    }, [getPaymentMethods, refresh]);

    return {
        isPgOptionsLoading,
        availablePgOptions,
        isPgDown,
        getPaymentMethods,
    };
};

export default useGetAllPaymentMode;
