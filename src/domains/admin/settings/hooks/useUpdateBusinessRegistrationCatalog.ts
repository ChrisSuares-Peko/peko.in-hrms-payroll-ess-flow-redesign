import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { putUpdateCatalog } from '../api/businessRegistrationCatalog';
import { CatalogUpdatePayload } from '../types/businessRegistrationCatalog';

export default function useUpdateBusinessRegistrationCatalog() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const updateCatalogDetails = async (payload: CatalogUpdatePayload) => {
        setIsLoading(true);
        const response = await putUpdateCatalog({ userId: id, userType: role, ...payload });
        dispatch(
            showToast({
                description: response ? 'Catalog item updated successfully' : 'Could not update catalog item',
                variant: response ? 'success' : 'error',
            })
        );
        setIsLoading(false);
        return response;
    };

    return { isLoading, updateCatalogDetails };
}
