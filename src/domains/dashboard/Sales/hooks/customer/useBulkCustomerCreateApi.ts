import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { bulkCreateCustomers } from '../../api/customers';
import { BulkCustomerRow } from '../../types/customer';

export function useBulkCustomerCreateApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const bulkCreate = async (jsonData: BulkCustomerRow[]) => {
        setIsLoading(true);
        const resp = await bulkCreateCustomers({ jsonData, userId: id, userType: role });

        if (resp && resp.status) {
            dispatch(showToast({ variant: 'success', description: 'Bulk upload successful' }));
            navigate(`${paths.dashboard.sales}/${paths.sales.customerLeads}`);
        } else {
            dispatch(
                showToast({ variant: 'error', description: resp?.message || 'Bulk upload failed' })
            );
        }

        setIsLoading(false);
        return !!resp?.status;
    };

    return { bulkCreate, isLoading };
}
