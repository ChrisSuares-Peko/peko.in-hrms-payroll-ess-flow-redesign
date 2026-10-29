import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateGovtService } from '../api/govtServicesApi';
import { GovtServiceUpdatePayload } from '../types/govtServicesTypes';

export default function useGovtServicesAltering() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const updateService = async (payload: GovtServiceUpdatePayload) => {
        setIsLoading(true);
        const response = await updateGovtService({ userId: id, userType: role, ...payload });
        dispatch(
            showToast({
                description: response ? 'Catalog item updated successfully' : 'Could not update catalog item',
                variant: response ? 'success' : 'error',
            })
        );
        setIsLoading(false);
        return response;
    };

    return { isLoading, updateService };
}
