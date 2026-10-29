import { useCallback, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { addCustomer, deleteCustomer, updateCustomer } from '../api/index';
import { UserPayload } from '../types/customertypes';

export const useCustomerAdd = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();

    const customerAdd = useCallback(
        async (payload: UserPayload) => {
            setIsLoading(true);
            const data: any | false = await addCustomer({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                dispatch(
                    showToast({
                        description: 'Customer added successfully',
                        variant: 'success',
                    })
                );
                return true;
            }
            setIsLoading(false);
            return false;
        },
        [dispatch, id, role]
    );

    const customerUpdate = useCallback(
        async (payload: UserPayload) => {
            setIsLoading(true);
            const data: any | false = await updateCustomer({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                dispatch(
                    showToast({
                        description: 'Customer updated successfully',
                        variant: 'success',
                    })
                );
                return true;
            }
            setIsLoading(false);
            return false;
        },
        [dispatch, id, role]
    );

    const customerDelete = useCallback(
        async (cId: number) => {
            setIsLoading(true);
            const data: any = await deleteCustomer({
                userId: id,
                userType: role,
                id: cId,
            });
            if (data) {
                dispatch(
                    showToast({
                        description: 'Customer deleted successfully',
                        variant: 'success',
                    })
                );
                return true;
            }
            setIsLoading(false);
            return false;
        },
        [dispatch, id, role]
    );

    return { isLoading, customerAdd, customerUpdate, customerDelete };
};
