import { useCallback, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { EXPORT_EXTENSIONS, ExportFormat } from '../types/export';

export default function useFileExport(
    download: (format: ExportFormat) => Promise<Blob | false>,
    fileName: string
) {
    const dispatch = useAppDispatch();
    const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

    const exportAs = useCallback(
        async (format: ExportFormat) => {
            setExportingFormat(format);
            const blob = await download(format);
            setExportingFormat(null);

            if (!blob) {
                dispatch(
                    showToast({
                        description:
                            'Could not export. If there are many rows, narrow the date range and try again.',
                        variant: 'error',
                    })
                );
                return;
            }
            saveAs(blob, `${fileName}.${EXPORT_EXTENSIONS[format]}`);
        },
        [dispatch, download, fileName]
    );

    return { exportingFormat, exportAs };
}
