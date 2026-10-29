import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { bulkUpdateCardState, BulkCardStatePayload } from '../../api/admin/bulkCardStateApi';

export const useBulkCardStateApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const submitBulkCardState = async (payload: BulkCardStatePayload) => {
        setIsLoading(true);
        const res = await bulkUpdateCardState(role, id, payload);
        setIsLoading(false);
        return res;
    };

    return { submitBulkCardState, isLoading };
};
