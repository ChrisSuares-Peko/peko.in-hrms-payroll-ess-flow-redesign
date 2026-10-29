import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { uploadDocumentRequest } from '../../api/documentRequestApi';

export default function useUploadDocumentRequestApi(onSuccess?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setLoading] = useState(false);
    const dispatch = useAppDispatch();

    const handleUpload = async (requestId: string, values: { document: string; documentFormat: string; note?: string }) => {
        setLoading(true);
        const response = await uploadDocumentRequest({
            userType: role,
            userId: id,
            requestId,
            document: { base64: values.document, format: values.documentFormat },
            note: values.note,
        });
        if (response) {
            dispatch(
                showToast({
                    description: 'Document uploaded successfully',
                    variant: 'success',
                })
            );
            if (onSuccess) onSuccess();
        }
        setLoading(false);
        return !!response;
    };

    return { handleUpload, isLoading };
}
