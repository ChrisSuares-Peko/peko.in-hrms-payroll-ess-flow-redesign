import { useCallback, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppSelector } from '@src/hooks/store';

import { GetForm24ExcelTemplate } from '../../api/reports/form24';

export default function useGetForm24Template() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const getExcelTemplate = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await GetForm24ExcelTemplate({ userId: id, userType: role });

            if (response?.buffer) {
                // 🔥 Convert base64 to binary
                const byteCharacters = atob(response.buffer);
                const byteNumbers = new Array(byteCharacters.length);
                // eslint-disable-next-line no-plusplus
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);

                const blob = new Blob([byteArray], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });

                saveAs(blob, 'Form24Template.xlsx');
            } else {
                console.error('No buffer received in response');
            }
        } catch (error) {
            console.error('Failed to download Excel template:', error);
        } finally {
            setIsLoading(false);
        }
    }, [id, role]);

    return { getExcelTemplate, isLoading };
}
