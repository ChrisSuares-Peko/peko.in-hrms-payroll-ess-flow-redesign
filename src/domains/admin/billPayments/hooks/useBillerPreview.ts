import { useState, useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { previewBillersFromExcel, previewBillersFromJson } from '../api/billers';
import { BillerPreviewResponse } from '../types/billers';

export const useBillerPreview = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [previewData, setPreviewData] = useState<BillerPreviewResponse | null>(null);

    const previewFromExcel = useCallback(
        async (file: File) => {
            setIsLoading(true);
            try {
                const response = await previewBillersFromExcel({
                    userId: id,
                    userType: role,
                    file,
                });
                setIsLoading(false);
                if (response) {
                    setPreviewData(response);
                    return response;
                }
                return null;
            } catch (err) {
                setIsLoading(false);
                return null; 
            }
        },
        [id, role]
    );

    const previewFromJson = useCallback(
        async (billersJsonData: Array<{ billerId: string }>) => {
            setIsLoading(true);
            try {
                const response = await previewBillersFromJson({
                    userId: id,
                    userType: role,
                    billersJsonData,
                });
                setIsLoading(false);
                if (response) {
                    setPreviewData(response);
                    return response;
                }
                return null;
            } catch (err) {
                setIsLoading(false);
                return null; 
            }
        },
        [id, role]
    );

    const clearPreview = useCallback(() => {
        setPreviewData(null);
    }, []);

    return {
        isLoading,
        previewData,
        previewFromExcel,
        previewFromJson,
        clearPreview,
    };
};
