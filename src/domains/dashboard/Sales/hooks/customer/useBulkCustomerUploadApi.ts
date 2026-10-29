import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { bulkUploadCustomers } from '../../api/customers';
import { setBulkCustomerData } from '../../slices/bulkCustomerSlice';

export function useBulkCustomerUploadApi() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const uploadBulkCustomers = async (file: File) => {
        setIsLoading(true);
        const resp = await bulkUploadCustomers({ file, userId: id, userType: role });

        if (resp && resp.status) {
            dispatch(setBulkCustomerData(resp.data.jsonData));
            dispatch(showToast({ variant: 'success', description: 'Please review the records' }));
            navigate(
                `${paths.dashboard.sales}/${paths.sales.customerLeads}/${paths.sales.customersBulkUpload}`
            );
        } else {
            dispatch(
                showToast({
                    variant: 'error',
                    description: resp?.message || 'Failed to upload file',
                })
            );
        }

        setIsLoading(false);
        return !!resp?.status;
    };

    return { uploadBulkCustomers, isLoading };
}
