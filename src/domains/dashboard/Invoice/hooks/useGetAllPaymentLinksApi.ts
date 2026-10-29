import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllPaymentLinks, resendPaymentLinkApi } from '../api/index';
import { getCustomers } from '../types/guidelineTypes';
import { OrderHistoryResponse, PaymentLinkOrder, Statistics } from '../types/paymentlinkType';

export const useAllpaymentLinks = ({ searchText, itemsPerPage, page, sort }: getCustomers) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<PaymentLinkOrder[]>([]);
    const [statisticsData, setStatisticsData] = useState<Statistics>();
    const dispatch = useAppDispatch();

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: OrderHistoryResponse | false = await getAllPaymentLinks({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
            setStatisticsData(data.statistics);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, itemsPerPage, page, role, searchText, sort]);

    const resendPaymentLink = useCallback(
        async (paymentLinkId: number) => {
            setIsLoading(true);
            const data: {} | false = await resendPaymentLinkApi({
                userId: id,
                userType: role,
                paymentLinkId,
            });
            if (data) {
                dispatch(
                    showToast({
                        description: 'Payment link sent successfully.',
                        variant: 'success',
                    })
                );
            }
            setIsLoading(false);
        },
        [id, role, dispatch]
    );

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return { isLoading, tableData, count, setRefresh, statisticsData, resendPaymentLink };
};
