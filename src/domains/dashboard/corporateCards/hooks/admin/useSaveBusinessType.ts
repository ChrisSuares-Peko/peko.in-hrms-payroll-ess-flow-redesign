import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { saveKybBusinessType } from '../../api/admin/kybStatusApi';
import { setBusinessType, setKybStage } from '../../slices/corporateCardsSlice';
import { KYB_INTRO } from '../../utils/kybData';

export const useSaveBusinessType = () => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [saveLoading, setSaveLoading] = useState(false);

    const handleSaveBusinessType = async (businessType: string) => {
        setSaveLoading(true);
        const res = await saveKybBusinessType(role, id, businessType);
        setSaveLoading(false);

        if (!res) {
            dispatch(
                showToast({ variant: 'error', description: KYB_INTRO.businessTypeSaveFailed })
            );
            return;
        }

        dispatch(setBusinessType(businessType));
        dispatch(setKybStage('upload'));
    };

    return { handleSaveBusinessType, saveLoading };
};
