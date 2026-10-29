import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { bulkValidateCustomers } from '../../api/customers';
import { setBulkCustomerData } from '../../slices/bulkCustomerSlice';
import { BulkCustomerRow } from '../../types/customer';

export function useBulkCustomerValidateApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const bulkValidate = async (jsonData: BulkCustomerRow[]) => {
        setIsLoading(true);
        const resp = await bulkValidateCustomers({ jsonData, userId: id, userType: role });

        if (resp && resp.status) {
            dispatch(setBulkCustomerData(resp.data.jsonData));
        } else {
            dispatch(
                showToast({ variant: 'error', description: resp?.message || 'Validation failed' })
            );
        }

        setIsLoading(false);
    };

    return { bulkValidate, isLoading };
}
