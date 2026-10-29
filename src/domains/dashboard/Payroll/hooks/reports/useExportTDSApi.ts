import { useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppSelector } from '@src/hooks/store';

import { getTdsReportExcel } from '../../api/reports/tds';

export default function useExportTds() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const getTDSExcel = async (
        month: string,
        year: string,
        regimeType:string
    ) => {
        setIsLoading(true);
        const data: any | false = await getTdsReportExcel({
            userId: id,
            userType: role,
            year,
            month,
            regimeType,
        });

        if (data) {
            console.log(data)
            // Handle dynamic file type and extension
            const buffer = data?.buffer
                const type = data?.fileType;
                let extension = 'bin';

                if (type.includes('pdf')) extension = 'pdf';
                else if (type.includes('csv')) extension = 'csv';
                else if (
                    type.includes('excel') ||
                    type.includes('spreadsheet') ||
                    type.includes('sheet') ||
                    type.includes('xlsx')
                ) extension = 'xlsx';

                const uint8Array = new Uint8Array(buffer.data);
                const blob = new Blob([uint8Array], { type });
                saveAs(blob, `TDS.${extension}`);
        }
        setIsLoading(false);
    };

    return { isLoading, getTDSExcel };
}
