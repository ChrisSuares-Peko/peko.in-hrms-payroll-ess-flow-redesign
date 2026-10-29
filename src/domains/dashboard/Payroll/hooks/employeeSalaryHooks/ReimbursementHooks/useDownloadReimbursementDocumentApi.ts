import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { downloadReimbursementDocument } from '../../../api/employeeSalaryApi/ReimbursementApi/index';

export const useDownloadReimbursementDocumentApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const downloadDocument = useCallback(
        async (reimbursementId: string, filename: string) => {
            setIsLoading(true);
            try {
                const blob = await downloadReimbursementDocument({ userId: id, userType: role, reimbursementId });
                const objectUrl = URL.createObjectURL(blob);
                const extension = blob.type.split('/').pop();
                const a = document.createElement('a');
                a.href = objectUrl;
                a.download = extension ? `${filename}.${extension}` : filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(objectUrl);
            } catch (error) {
                dispatch(showToast({ description: 'Failed to download document', variant: 'error' }));
            }
            setIsLoading(false);
        },
        [dispatch, id, role]
    );

    return { downloadDocument, isLoading };
};
