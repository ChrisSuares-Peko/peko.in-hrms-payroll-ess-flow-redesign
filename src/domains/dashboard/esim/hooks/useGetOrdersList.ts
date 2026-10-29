import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getOrdersList } from '../api/index';
import { ordersList } from '../types/ordersList';

export default function useGetOrdersList(
    itemsPerPage: number,
    page: number,
    searchText: string,
    fromDate: string,
    toDate: string
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [packages, setPackages] = useState<any>();
    const [totalRecord, setTotalRecord] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const getOrders = useCallback(async () => {
        setIsLoading(true);
        const data: ordersList | false = await getOrdersList({
            userId: id,
            userType: role,
            itemsPerPage,
            page,
            searchText,
            fromDate,
            toDate,
        });

        if (data) {
            const arr = data.data.map(item => ({
                date: item.createdAt,
                id: item.orderId,
                plan: item.planName ?? '',
                amount: item.amountInINR,
                orderId: item.corporateTxnId,
                quantity: 1,
                iccid: item.simDetailsEsim,
                planId: item.simDetailsPlanId ?? '',
                paymentMethod: (item.paymentMode ?? '').toLowerCase(),
                status: item?.status || '',
                customerUid: item.customerUid,
                country: item.country,
                dataSize: item.dataSize ?? '',
                validity: item.validity ?? '',
                activationMode: item.activationMode ?? '',
                activatedAt: item.activatedAt,
                expiresAt: item.expiresAt,
                installationUrl: item.installationUrl ?? '',
                purchasedFor: item.purchasedForName ?? '',
            }));

            setPackages(arr);
            setTotalRecord(data.recordsTotal);
            setIsLoading(false);
        }
        setIsLoading(false);
    }, [id, itemsPerPage, page, role, searchText, fromDate, toDate]);

    useEffect(() => {
        getOrders();
    }, [getOrders]);

    return { data: packages, totalRecord, isLoading };
}
