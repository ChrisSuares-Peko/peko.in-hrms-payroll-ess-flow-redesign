import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { UploadForm24Api } from '../../api/reports/form24';

export default function useUploadForm24Api() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const uploadFile = useCallback(
        async (file: File, quarter: string) => {
            setIsLoading(true);
            try {
                const response = await UploadForm24Api({
                    file,
                    userId: id,
                    userType: role,
                    quarter,
                });
                console.log('Response from uploadFile:', response);
                if (response) {
                    dispatch(
                        showToast({
                            description: 'File uploaded successfully',
                            variant: 'success',
                        })
                    );
                    console.log('File uploaded successfully:', response);
                } else {
                    console.error('File upload failed');
                }
            } catch (error) {
                dispatch(
                    showToast({
                        description: 'Error uploading file. Please try again later.',
                        variant: 'error',
                    })
                );

                console.error('Error uploading file:', error);
            } finally {
                setIsLoading(false);
            }
        },
        [dispatch, id, role]
    );

    return { uploadFile, isLoading };
}
