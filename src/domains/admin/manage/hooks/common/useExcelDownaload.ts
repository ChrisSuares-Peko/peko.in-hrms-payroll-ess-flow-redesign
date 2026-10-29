import { useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppSelector } from '@src/hooks/store';

import { getExcelLink } from '../../api/excelDownload';

export default function useExcelDownaload() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [excelLoading, setExcelDownloading] = useState(false);

    const downloadExcelFile = async (apiPath: string, fileName: string) => {
        setExcelDownloading(true);
        const data = await getExcelLink({
            userType: role,
            userId: id,
            apiPath,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            saveAs(blob, `${fileName}.xlsx`);
        }
        setExcelDownloading(false);
    };

    return {
        downloadExcelFile,
        excelLoading,
    };
}
