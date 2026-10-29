import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { exportSalaryEmployees } from '../../../api/employeeSalaryApi/salaryRolloutApi';

export const useExportSalaryEmployees = (type: 'active' | 'past') => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isExporting, setIsExporting] = useState(false);

    const exportEmployees = async () => {
        setIsExporting(true);
        const result = await exportSalaryEmployees({ userId: String(id), userType: role, type });
        if (result) {
            const blob = new Blob([new Uint8Array(result.buffer.data)], { type: result.fileType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `salary-${type}-employees.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        }
        setIsExporting(false);
    };

    return { exportEmployees, isExporting };
};
