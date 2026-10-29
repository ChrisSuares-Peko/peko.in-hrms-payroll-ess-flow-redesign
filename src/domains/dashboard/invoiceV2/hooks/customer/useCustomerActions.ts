import { useCallback, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { addNewCustomer, deleteCustomerApi, editCustomerApi } from '../../api/customers';
import { AddCustomerFormValues } from '../../types/customer';

const useCustomerActions = (onSuccess?: () => void) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const addCustomer = useCallback(
        async (payload: AddCustomerFormValues) => {
            setIsLoading(true);
            const resp = await addNewCustomer({ userId: id, userType: role, ...payload });
            if (resp && resp.status) {
                dispatch(
                    showToast({ description: 'Customer added successfully', variant: 'success' })
                );
                onSuccess?.();
                setIsLoading(false);
                return true;
            }
            if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setIsLoading(false);
            return false;
        },
        [dispatch, id, role, onSuccess]
    );

    const editCustomer = useCallback(
        async (customerId: string, payload: AddCustomerFormValues) => {
            setIsLoading(true);
            const resp = await editCustomerApi(customerId, {
                userId: id,
                userType: role,
                ...payload,
            });
            if (resp && resp.status) {
                dispatch(
                    showToast({ description: 'Customer updated successfully', variant: 'success' })
                );
                onSuccess?.();
                setIsLoading(false);
                return true;
            }
            if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setIsLoading(false);
            return false;
        },
        [dispatch, id, role, onSuccess]
    );

    const deleteCustomer = useCallback(
        async (customerId: string) => {
            setIsLoading(true);
            const resp = await deleteCustomerApi({ userId: id, userType: role, customerId });
            if (resp && resp.status) {
                dispatch(
                    showToast({ description: 'Customer deleted successfully', variant: 'success' })
                );
                onSuccess?.();
            } else if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setIsLoading(false);
        },
        [dispatch, id, role, onSuccess]
    );

    return { addCustomer, editCustomer, deleteCustomer, isLoading };
};

export default useCustomerActions;
