import { useState, useCallback, useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getHikeOrderHistoryTable } from '../api/orders';
import { OrderHistoryListResponse, SelectedHike, useOrderHistoryApiProps } from '../types/index';

interface HikeHistoryTableItem {
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
    id: number;
}

export const useGetHikeHistoryApi = ({
    page,
    itemsPerPage,
    search,
    from,
    to,
}: useOrderHistoryApiProps) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<{ data: HikeHistoryTableItem[]; total: number } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const getHikeHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await getHikeOrderHistoryTable({
                userId: id,
                userType: role,
                search,
                start: page,
                length: itemsPerPage,
                from,
                to,
            });

            if (!response) {
                dispatch(
                    showToast({
                        description: 'Something went wrong while fetching hike history',
                        variant: 'error',
                    })
                );
                return;
            }

            const transformedData: HikeHistoryTableItem[] = (
                response as OrderHistoryListResponse
            ).result.map(item => {
                const orderResponse = JSON.parse(item.order.orderResponse);
                return {
                    date: item.order.transactionDate,
                    hikes: orderResponse.selectedHikes.map((hike: SelectedHike) => ({
                        name: hike.hikeName,
                        quantity: hike.quantity,
                        price: hike.price,
                        totalPrice: hike.totalPrice,
                        employees: hike.employees || [],
                    })),
                    totalAmount: item.order.amountInINR,
                    status: item.order.status,
                    id: item.order.id,
                };
            });

            setData({
                data: transformedData,
                total: (response as OrderHistoryListResponse).totalData,
            });
        } catch (err) {
            dispatch(
                showToast({
                    description: 'Something went wrong while fetching hike history',
                    variant: 'error',
                })
            );
          
        } finally {
            setIsLoading(false);
        }
    }, [id, role, search, page, itemsPerPage, from, to, dispatch]);

    useEffect(() => {
        getHikeHistory();
    }, [getHikeHistory]);

    return {
        hikeHistoryData: data?.data || [],
        total: data?.total || 0,
        isLoading,
    };
};
