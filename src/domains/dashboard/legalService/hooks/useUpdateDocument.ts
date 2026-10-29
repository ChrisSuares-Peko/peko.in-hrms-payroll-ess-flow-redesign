import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateLegalDocument } from '../api';
import type { UpdateDocumentPayload } from '../types';

const useUpdateDocument = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const updateDocument = useCallback(async (payload: UpdateDocumentPayload) => {
        setIsLoading(true);
        const data = await updateLegalDocument({ userId: id, userType: role, ...payload });
        setIsLoading(false);
        if (data) {
            dispatch(showToast({ description: data.message || 'Document updated successfully', variant: 'success' }));
            return data;
        }
        dispatch(showToast({ description: 'Failed to update document', variant: 'error' }));
        return null;
    }, [id, role, dispatch]);

    return { updateDocument, isLoading };
};

export default useUpdateDocument;
