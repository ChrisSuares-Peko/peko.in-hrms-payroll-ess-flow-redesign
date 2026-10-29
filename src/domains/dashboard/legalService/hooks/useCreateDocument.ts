import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createLegalDocument } from '../api';

const useCreateDocument = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const saveDocument = useCallback(
        async ({ title, editorHtml }: { title: string; editorHtml: string }) => {
            setIsLoading(true);
            const data = await createLegalDocument({
                userId: id,
                userType: role,
                title,
                editorHtml,
            });
            setIsLoading(false);
            if (data) {
                dispatch(
                    showToast({
                        description: data.message || 'Document saved as draft',
                        variant: 'success',
                    })
                );
                return data;
            }
            dispatch(showToast({ description: 'Failed to save document', variant: 'error' }));
            return null;
        },
        [id, role, dispatch]
    );

    return { saveDocument, isLoading };
};

export default useCreateDocument;
