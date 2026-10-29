import { useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppSelector } from '@src/hooks/store';

import { getDocument } from '../api/document';
import { mimeTypeMapping } from '../utils/mimeTypes';

export default function useDownloadDocument(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const handleDocumentDownload = async (key: string, fileName: string) => {
        setIsLoading(true);
        const payload = {
            key,
            userId: id,
            userType: role,
        };
        const data = await getDocument(payload);
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);
            const extension = data.type;
            const mimeType = mimeTypeMapping[extension] || 'application/octet-stream';
            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: mimeType,
            });

            saveAs(blob, `${fileName}.${extension}`);
            if (handleCancel) {
                handleCancel();
            }
        }
        setIsLoading(false);
        return data;
    };

    return { handleDocumentDownload, isLoading };
}
