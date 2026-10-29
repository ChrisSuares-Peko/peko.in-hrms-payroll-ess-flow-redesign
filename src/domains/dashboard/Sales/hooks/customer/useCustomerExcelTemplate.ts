import { useCallback, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppSelector } from '@src/hooks/store';

import { getCustomerBulkExcelTemplate } from '../../api/customers';

export function useCustomerExcelTemplate() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const downloadTemplate = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await getCustomerBulkExcelTemplate({ userId: id, userType: role });
            const bufferData = response?.buffer?.data;

            if (bufferData) {
                const blob = new Blob([new Uint8Array(bufferData)], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });
                saveAs(blob, 'BulkUploadCustomerTemplate.xlsx');
            }
        } catch (error) {
            console.error('Failed to download Excel template:', error);
        } finally {
            setIsLoading(false);
        }
    }, [id, role]);

    return { downloadTemplate, isLoading };
}
