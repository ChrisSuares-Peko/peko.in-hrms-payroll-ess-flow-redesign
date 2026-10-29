import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { saveEpfSettingsApi, saveTdsSettingsApi } from '../../api/complianceSettings/index';
import {
    EpfPayload,
    saveEpfResponse,
    TdsSettingsPayload,
} from '../../types/complianceSettings/complianceSettingsType';

export default function useAddEpfSettingsApi(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [responseData] = useState<saveEpfResponse | false>();
    const [nextStep, setNextStep] = useState<Boolean>(false);
    const dispatch = useAppDispatch();

    const handleSaveEpfData = async (payload: EpfPayload) => {
        const response = await saveEpfSettingsApi({
            ...payload,
            userId: id,
            userType: role,
        });
        if (response.success && response.data) {
            dispatch(
                showToast({
                    description: response.data.message || 'Epf settings saved successfully',
                    variant: 'success',
                })
            );
            setNextStep(true);
            if (handleCancel) handleCancel();
        } else {
            dispatch(
                showToast({
                    description: response.errorMessage || 'Failed to save EPF settings',
                    variant: 'error',
                })
            );
        }
    };

    const handleSaveTdsData = async (payload: TdsSettingsPayload) => {
        const response = await saveTdsSettingsApi({
            ...payload,
            userId: id,
            userType: role,
        });
        if (response.success && response.data) {
            dispatch(
                showToast({
                    description: response.data.message || 'TDS settings saved successfully',
                    variant: 'success',
                })
            );
            setNextStep(true);
            if (handleCancel) handleCancel();
        }
    };

    return { handleSaveEpfData, responseData, nextStep, handleSaveTdsData };
}
