import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce'; // Import your custom debounce hook

import { getAllInvoices } from '../api/index';
import { getAllInvoicesTypes } from '../types/index';

const useGetInvoice = () => {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [searchText, setSearchText] = useState<string>();
    const [limit, setLimit] = useState<number>(10);
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<getAllInvoicesTypes | undefined>(undefined);
    const [count, setCount] = useState<number>();
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Apply debounce to searchText
    const debouncedSearchText = useDebounce(searchText ?? '', 500);

    const getInvoices = useCallback(async () => {
        setIsLoading(true);
        const invoices = await getAllInvoices({
            userId: id,
            userType: role,
            searchText: debouncedSearchText,
            currentPage,
            limit,
        });
        if (invoices) {
            setData(invoices);
            setCount(invoices.recordsTotal);
        }
        setIsLoading(false);
    }, [currentPage, id, limit, role, debouncedSearchText]);

    useEffect(() => {
        getInvoices();
    }, [getInvoices]);

    return {
        data,
        isLoading,
        searchText,
        setSearchText,
        count,
        setCurrentPage,
        currentPage,
        limit,
        setLimit,
    };
};

export default useGetInvoice;
