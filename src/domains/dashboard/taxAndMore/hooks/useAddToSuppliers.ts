import { useCallback, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { addVendor } from '../api/tax';
import { AddVendorPayload } from '../types';

const useAddToSuppliers = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isAdding, setIsAdding] = useState(false);

    const addToSuppliers = useCallback(
        async (payload: AddVendorPayload) => {
            setIsAdding(true);
            const resp = await addVendor({ userId: id, userType: role, ...payload });
            if (resp && resp.status) {
                dispatch(
                    showToast({ description: 'Supplier added successfully', variant: 'success' })
                );
                setIsAdding(false);
                return true;
            }
            dispatch(
                showToast({
                    description: resp?.message || 'Failed to add supplier',
                    variant: 'error',
                })
            );
            setIsAdding(false);
            return false;
        },
        [id, role, dispatch]
    );

    return { addToSuppliers, isAdding };
};

export default useAddToSuppliers;
