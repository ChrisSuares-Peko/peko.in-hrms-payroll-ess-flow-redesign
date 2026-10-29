import { useCallback, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { addCustomer } from '../api/tax';
import { AddCustomerPayload } from '../types';

const useAddToCustomers = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isAdding, setIsAdding] = useState(false);

    const addToCustomers = useCallback(
        async (payload: AddCustomerPayload) => {
            setIsAdding(true);
            const resp = await addCustomer({ userId: id, userType: role, ...payload });
            if (resp && resp.status) {
                dispatch(
                    showToast({ description: 'Customer added successfully', variant: 'success' })
                );
                setIsAdding(false);
                return true;
            }
            dispatch(
                showToast({
                    description: resp?.message || 'Failed to add customer',
                    variant: 'error',
                })
            );
            setIsAdding(false);
            return false;
        },
        [id, role, dispatch]
    );

    return { addToCustomers, isAdding };
};

export default useAddToCustomers;
