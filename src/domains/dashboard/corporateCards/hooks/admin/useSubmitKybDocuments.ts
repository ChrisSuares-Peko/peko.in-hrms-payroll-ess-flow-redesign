import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { KybChecklistDocument, uploadKybDocuments } from '../../api/admin/kybStatusApi';
import { KybFileValue } from '../../utils/types';

export const useSubmitKybDocuments = (
    onSubmitted: (values: Record<string, KybFileValue | null>) => void | Promise<void>,
    documents: KybChecklistDocument[] = []
) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [submitLoading, setSubmitLoading] = useState(false);

    const handleSubmit = async (values: Record<string, KybFileValue | null>) => {
        const payload = documents
            .map(doc => ({ doc, file: values[`doc_${doc.key}`] }))
            .filter(
                (entry): entry is { doc: KybChecklistDocument; file: KybFileValue } => !!entry.file
            )
            .map(({ doc, file }) => ({
                documentName: doc.documentName,
                fileBase: file.base64,
                fileFormat: file.format,
            }));

        setSubmitLoading(true);

        // eslint-disable-next-line no-restricted-syntax
        for (const document of payload) {
            // eslint-disable-next-line no-await-in-loop
            const uploadRes = await uploadKybDocuments(role, id, [document]);
            if (!uploadRes) {
                dispatch(
                    showToast({
                        variant: 'error',
                        description: `Failed to upload ${document.documentName}. Please try again.`,
                    })
                );
                setSubmitLoading(false);
                return;
            }
        }

        setSubmitLoading(false);

        await onSubmitted(values);
    };

    return { handleSubmit, submitLoading };
};
