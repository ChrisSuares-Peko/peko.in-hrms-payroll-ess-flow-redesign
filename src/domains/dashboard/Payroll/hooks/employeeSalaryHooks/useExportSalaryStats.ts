import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { exportSalaryStatsApi } from '../../api/salaryHistoryApi/salaryStats';

export const useExportSalaryStats = () => {
    const { corporateId } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isExporting, setIsExporting] = useState(false);

    const exportSalaryStats = async (year: string | number) => {
        setIsExporting(true);
        const result = await exportSalaryStatsApi(corporateId, year);
        if (!result) {
            dispatch(showToast({ variant: 'error', description: 'Failed to export. Please try again.' }));
            setIsExporting(false);
            return;
        }
        const { buffer, fileType } = result;
        const byteArray = new Uint8Array(buffer.data);
        const blob = new Blob([byteArray], { type: fileType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `salary-stats-${year}.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        setIsExporting(false);
    };

    return { exportSalaryStats, isExporting };
};
