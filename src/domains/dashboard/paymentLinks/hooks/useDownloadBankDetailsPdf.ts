import { useCallback, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { exportBankDetailsPdf } from '../api';

export default function useDownloadBankDetailsPdf() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isDownloading, setIsDownloading] = useState(false);

    const downloadPdf = useCallback(async () => {
        setIsDownloading(true);
        try {
            const data: CommonFileBuffer | false = await exportBankDetailsPdf({
                userId: id,
                userType: role,
                type: 'pdf',
            });

            if (!data) return;

            const arrayBuffer = new Uint8Array(data.buffer.data);
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });
            saveAs(blob, 'Bank_Transfer_Details.pdf');
        } finally {
            setIsDownloading(false);
        }
    }, [id, role]);

    return {
        isDownloading,
        downloadPdf,
    };
}
