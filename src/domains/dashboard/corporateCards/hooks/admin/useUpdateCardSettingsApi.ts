import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { UpdateCardSettingsPayload, updateCardSettings } from '../../api/admin/cardLimitsApi';

export const useUpdateCardSettingsApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const submitSettings = async (cardIssuanceId: string, payload: UpdateCardSettingsPayload) => {
        setIsLoading(true);
        const res = await updateCardSettings(role, id, cardIssuanceId, payload);
        setIsLoading(false);
        return res;
    };

    return { submitSettings, isLoading };
};
