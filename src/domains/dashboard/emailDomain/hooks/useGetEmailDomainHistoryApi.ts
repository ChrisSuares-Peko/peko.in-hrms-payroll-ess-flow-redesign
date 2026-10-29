import { useState, useCallback, useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getEmailDomainOrderHistoryTable } from '../api/orders';
import { OrderHistoryListResponse, useOrderHistoryApiProps } from '../types/index';

interface EmailDomainHistoryTableItem {
    date: string;
    hikes?: Array<{
        name: string;
        quantity: number;
        price: number;
        totalPrice: number;
        employees?: Array<{
            name: string;
            employeeId: string;
        }>;
    }>;
    totalAmount: string;
    status: string;
}

export const useGetEmailDomainHistoryApi = ({
    page,
    itemsPerPage,
    search,
    from,
    to,
    productId,
}: useOrderHistoryApiProps) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<{ data: EmailDomainHistoryTableItem[]; total: number } | null>(
        null
    );
    const [isLoading, setIsLoading] = useState(false);

    const getEmailDomainHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await getEmailDomainOrderHistoryTable({
                userId: id,
                userType: role,
                search,
                start: page,
                length: itemsPerPage,
                from,
                to,
                productId,
            });

            if (!response) {
                dispatch(
                    showToast({
                        description: 'Something went wrong while fetching email or domain history',
                        variant: 'error',
                    })
                );
                return;
            }

            const transformedData: EmailDomainHistoryTableItem[] = (
                response as OrderHistoryListResponse
            ).result.map((item: any) => {
                const orderResponse = JSON.parse(item.order.orderResponse);
                return {
                    date: item.order.transactionDate,
                    emailDomain: orderResponse.emailDomainsDetails,
                    totalAmount: item.order.amountInINR,
                    status: item.order.status,
                    formDetails: orderResponse.formDetails,
                    corporateTxnId: item?.corporateTxnId,
                    paymentMode: item?.order?.paymentMode,
                    id: item?.order?.id ?? '',
                };
            });

            setData({
                data: transformedData,
                total: (response as OrderHistoryListResponse).totalData,
            });
        } catch (err) {
            dispatch(
                showToast({
                    description: 'Something went wrong while fetching email or domain history',
                    variant: 'error',
                })
            );
          
        } finally {
            setIsLoading(false);
        }
    }, [id, role, search, page, itemsPerPage, from, to, productId, dispatch]);

    useEffect(() => {
        getEmailDomainHistory();
    }, [getEmailDomainHistory]);

    return {
        historyData: data?.data || [],
        total: data?.total || 0,
        isLoading,
    };
};
