import { useCallback, useEffect, useRef, useState } from 'react';

import dayjs, { Dayjs } from 'dayjs';

import { useAppSelector } from '@src/hooks/store';
import { removeEmoji } from '@utils/regex';

import { fetchOrderDetails } from '../../api';
import { IPurchaseItem } from '../../types/product';
import scrollTotop from '../../utils/scrollTotop';

export type IOrderDetailsFilter = {
    from: Dayjs | null;
    to: Dayjs | null;
    search: string;
    page: number;
    limit: number;
};

const useOrderHistory = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [orderDetails, setOrderDetails] = useState<IPurchaseItem[]>([]);
    const [total, setTotal] = useState(0);
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [searchInput, setSearchInput] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [filter, setFilter] = useState<IOrderDetailsFilter>({
        from: dayjs().subtract(1, 'month'),
        to: dayjs(),
        search: '',
        page: 1,
        limit: 10,
    });

    const getOrderDetails = useCallback(async () => {
        setIsLoading(true);
        const data = await fetchOrderDetails({
            userId: id,
            userType: role,
            from: filter.from ? filter.from.toISOString() : null,
            to: filter.to ? filter.to.toISOString() : null,
            searchText: filter.search,
            page: filter.page,
            limit: filter.limit,
        });
        if (data && data.data.orderDetails) {
            setOrderDetails(data.data.orderDetails);
            if (data.data?.totalData) {
                setTotal(data.data.totalData);
            }
        }
        setIsLoading(false);
    }, [id, role, filter]);

    useEffect(() => {
        getOrderDetails();
    }, [getOrderDetails]);

    useEffect(
        () => () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        },
        []
    );

    const handleFilterChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
        if (!dates) {
            setFilter(prev => ({ ...prev, from: null, to: dayjs(), page: 1 }));
            return;
        }
        const [from, to] = dates;
        setFilter(prev => ({ ...prev, from, to, page: 1 }));
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(removeEmoji, '');
        setSearchInput(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setFilter(prev => ({ ...prev, search: value, page: 1 }));
        }, 400);
    };

    const handlePagination = (page: number, pageSize: number) => {
        scrollTotop();
        setFilter(prev => ({ ...prev, page, limit: pageSize }));
    };

    return {
        orderDetails,
        isLoading,
        handleFilterChange,
        handleSearchChange,
        handlePagination,
        filter,
        searchInput,
        total,
    };
};

export default useOrderHistory;
