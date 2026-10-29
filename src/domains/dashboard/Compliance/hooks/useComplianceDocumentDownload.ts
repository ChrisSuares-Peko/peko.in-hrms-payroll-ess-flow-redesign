import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { downloadComplianceDocumentApi } from '../api';

const useComplianceDocumentDownload = () => {
    const { id: userId, role: userType } = useAppSelector((state) => (state.reducer as any).auth);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const downloadDocument = useCallback(
        async (id: string, url: string, name: string): Promise<void> => {
            setLoadingId(id);
            await downloadComplianceDocumentApi({ userId, userType, url, name });
            setLoadingId(null);
        },
        [userId, userType]
    );

    return { loadingId, downloadDocument };
};

export default useComplianceDocumentDownload;
