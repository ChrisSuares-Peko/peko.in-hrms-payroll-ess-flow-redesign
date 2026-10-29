import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllCustomers } from '../../api/customers';
import { CustomerRow } from '../../types/customer';

interface CustomerOption {
    label: string;
    value: number;
}

const useCustomers = (searchText?: string, itemsPerPage?: number) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [customers, setCustomers] = useState<CustomerRow[]>([]);
    const [options, setOptions] = useState<CustomerOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCustomers = useCallback(async () => {
        setIsLoading(true);
        const resp = await getAllCustomers({
            userId: id,
            userType: role,
            itemsPerPage: itemsPerPage || undefined,
            searchText: searchText || undefined,
        });
        if (resp && resp.status) {
            setCustomers(resp.data.customers);
            setOptions(resp.data.customers.map(c => ({ label: c.name, value: Number(c.id) })));
        } else if (resp && !resp.status) {
            dispatch(showToast({ description: resp.message, variant: 'error' }));
        }
        setIsLoading(false);
    }, [id, role, dispatch, searchText, itemsPerPage]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    return { customers, options, isLoading, refetch: fetchCustomers };
};

export default useCustomers;
