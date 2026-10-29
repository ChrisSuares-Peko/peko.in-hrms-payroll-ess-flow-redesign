import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { saveEsiSettings } from '../../api/complianceSettings/index';
import { EsiPayload, saveEpfResponse } from '../../types/complianceSettings/complianceSettingsType';

export default function useAddEsiSettingsApi(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [responseData] = useState<saveEpfResponse | false>();
    const [nextStep, setNextStep] = useState<Boolean>(false);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    

    const handleSaveEsiData = async (payload: EsiPayload) => {
        setIsLoading(true);
        const response = await saveEsiSettings({
            ...payload,
            userId: id,
            userType: role,
        });
        if (response.success && response.data) {
            dispatch(
                showToast({
                    description: response.data.message || 'Esi settings saved successfully',
                    variant: 'success',
                })
            );
            setNextStep(true);
            if (handleCancel) handleCancel();
        } else {
            dispatch(
                showToast({
                    description: response.errorMessage || 'Failed to save ESI settings',
                    variant: 'error',
                })
            );
        }
        setIsLoading(false);

    };

    return { handleSaveEsiData, responseData, nextStep ,isLoading};
}
