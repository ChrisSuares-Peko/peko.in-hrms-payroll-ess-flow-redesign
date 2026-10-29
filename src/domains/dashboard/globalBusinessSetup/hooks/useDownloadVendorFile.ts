import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getFileDownloadUrl } from '../api/globalBusinessSetup';

export const useDownloadVendorFile = () => {
    const dispatch = useAppDispatch();
    const { id, role } = useAppSelector(state => state.reducer.auth);

    return async (fileId?: string | null) => {
        if (!fileId) {
            dispatch(showToast({ description: 'File is not available', variant: 'error' }));
            return;
        }
        const data = await getFileDownloadUrl({ userId: id, userType: role, fileId });
        if (data && data.download_url) {
            window.open(data.download_url, '_blank', 'noopener,noreferrer');
        } else {
            dispatch(
                showToast({
                    description: 'Could not fetch file. Try again.',
                    variant: 'error',
                })
            );
        }
    };
};
