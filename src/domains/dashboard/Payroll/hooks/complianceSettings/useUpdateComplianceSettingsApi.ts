import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateComplianceSettingsApi } from '../../api/complianceSettings/index';

export default function useUpdateComplianceSettingsApi(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [responseData, setResponseData] = useState<false>();
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const handleSettingsUpdate = async (values: any) => {
        setIsLoading(true);

        const payload = {
            ...values,
        };
        const response = await updateComplianceSettingsApi({
            ...payload,
            userId: id,
            userType: role,
        });
        if (response) {
            dispatch(
                showToast({
                    description: 'Compliance Settings updated succesfully',
                    variant: 'success',
                })
            );
            if (handleCancel) handleCancel();
            setResponseData(response);
        }
        setIsLoading(false);
    };
    return { handleSettingsUpdate, responseData, isLoading };
}
