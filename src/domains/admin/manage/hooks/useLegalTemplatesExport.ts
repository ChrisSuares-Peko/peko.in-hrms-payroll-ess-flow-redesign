import { useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getLegalTemplatesExport } from '../api/legalTemplates';

const useLegalTemplatesExport = ({
    searchText,
    sort,
    sortField,
}: {
    searchText?: string;
    sort?: string;
    sortField?: string;
}) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isExporting, setIsExporting] = useState(false);

    const downloadReport = async (type: string) => {
        setIsExporting(true);
        const data: CommonFileBuffer | false = await getLegalTemplatesExport({
            userId: id,
            userType: role,
            type,
            searchText,
            sort,
            sortField,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);
            const blob = new Blob([arrayBuffer], { type: data.fileType });
            if (type === 'excel') saveAs(blob, 'Legal-Templates.xlsx');
            else if (type === 'csv') saveAs(blob, 'Legal-Templates.csv');
            else if (type === 'pdf') saveAs(blob, 'Legal-Templates.pdf');
        }
        setIsExporting(false);
    };

    return { downloadReport, isExporting };
};

export default useLegalTemplatesExport;
