import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getActiveDocumentRequests, requestDocumentApi } from '../api/documentRequests';
import { DocumentRequest } from '../types';

export const useDocumentRequests = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [requests, setRequests] = useState<DocumentRequest[]>([]);

    const fetchRequests = useCallback(async () => {
        const records = await getActiveDocumentRequests({ userType: role, userId: id });
        setRequests(records);
    }, [role, id]);

    const requestDocument = async (documentType: string, purpose?: string) => {
        try {
            await requestDocumentApi({ userType: role, userId: id }, documentType, purpose);
            await fetchRequests();
            dispatch(
                showToast({
                    description: 'Document request submitted successfully.',
                    variant: 'success',
                })
            );
            return true;
        } catch (err: any) {
            dispatch(
                showToast({
                    description: err?.response?.data?.message || 'Something went wrong.',
                    variant: 'error',
                })
            );
            return false;
        }
    };

    return { requests, fetchRequests, requestDocument };
};
