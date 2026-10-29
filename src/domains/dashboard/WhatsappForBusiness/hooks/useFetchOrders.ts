// useFetchOrders.ts
import { useState, useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchOrders } from '../api/orderHistory';
import { Order, Pagination } from '../types/orderHistory';

export const useFetchOrders = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        currentPage: 1,
        pageSize: 10,
        totalPages: 0,
        totalOrders: 0,
    });

    const loadOrders = useCallback(
        async (searchText: string, page: number, pageSize: number) => {
            setIsLoading(true);
            try {
                const data = await fetchOrders({
                    userId: id,
                    userType: role,
                    searchText,
                    page,
                    pageSize,
                });
                if (data) {
                    setOrders(data.orders);
                    setPagination(data.pagination);
                }
                setIsLoading(false);
            } catch (err) {
                setIsLoading(false);
            }
        },
        [id, role]
    );

    return { isLoading, orders, pagination, loadOrders };
};
