import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { saveLabWelfareFundApi } from '../../api/complianceSettings/index';
import {
    LabWelfarePayload,
    saveEpfResponse,
} from '../../types/complianceSettings/complianceSettingsType';

export default function useAddTLabWelfareFundApi(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [responseData] = useState<saveEpfResponse | false>();
    const [nextStep, setNextStep] = useState<Boolean>(false);
    const dispatch = useAppDispatch();
    const[isLoading,setIsLoading]=useState(false);

    const handleSaveLabourData = async (payload: LabWelfarePayload) => {
        setIsLoading(true);
        const response = await saveLabWelfareFundApi({
            ...payload,
            userId: id,
            userType: role,
        });
        if (response.success && response.data) {
            setIsLoading(false)
            dispatch(
                showToast({
                    description:
                        response.data.message || 'Labour Welfare Fund settings saved successfully',
                    variant: 'success',
                })
            );
            setNextStep(true);
            if (handleCancel) handleCancel();
        }
        setIsLoading(false)

    };

    return { handleSaveLabourData, responseData, nextStep,isLoading };
}
