import { useCallback, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppSelector } from '@src/hooks/store';

import { BulkExcelTemplate } from '../../api/employeeApi';

export default function GetExcelTemplate() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const getBulkExcelTemplate = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await BulkExcelTemplate({ userId: id, userType: role });

            const bufferData = response.buffer.data;

            if (response) {
                const blob = new Blob([new Uint8Array(bufferData)], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });
                saveAs(blob, 'ExcelTemplate.xlsx');
            } else {
                console.error(
                    'Failed to download Excel template: No data or incorrect response structure',
                    response
                );
            }
        } catch (error) {
            console.error('Failed to download Excel template:', error);
        } finally {
            setIsLoading(false);
        }
    }, [id, role]);

    return { getBulkExcelTemplate, isLoading };
}
