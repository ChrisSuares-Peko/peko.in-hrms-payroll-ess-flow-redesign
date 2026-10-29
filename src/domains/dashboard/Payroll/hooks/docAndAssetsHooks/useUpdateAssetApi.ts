import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateAsset } from '../../api/docAndAssetsApi/index';
import { DocResponse } from '../../types/docAndAssetsTypes';

export default function useDocumentUpdate(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [responseData, setResponseData] = useState<DocResponse | false>();
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const handleAssetUpdate = async (
        aId: string | undefined,
        employeeId: string | undefined,
        values: any
    ) => {
        setIsLoading(true);

        const payload = {
            ...values,
        };
        const response: false | DocResponse = await updateAsset({
            ...payload,
            userId: id,
            userType: role,
            aId,
            employeeId,
        });
        if (response) {
            dispatch(
                showToast({
                    description: 'Asset updated succesfully',
                    variant: 'success',
                })
            );
            if (handleCancel) handleCancel();
            setResponseData(response);
        }
        setIsLoading(false);
    };
    return { handleAssetUpdate, responseData, isLoading };
}
