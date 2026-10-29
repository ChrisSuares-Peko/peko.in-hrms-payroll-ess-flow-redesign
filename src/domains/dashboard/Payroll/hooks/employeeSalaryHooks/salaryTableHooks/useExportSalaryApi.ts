import { useCallback, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppSelector } from '@src/hooks/store';

import { ExportSalaryData } from '../../../api/employeeSalaryApi/employeeSalary';
import { exportSalaryDataResponse } from '../../../types/salaryProfileTypes/employeeSalaryTable';
import { monthNames } from '../../../utils/salaryTable/data';

export default function DownloadSalaryData() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const getSalaryDetails = useCallback(
        async (month: number | string, year: number | string, filter?: string) => {
            setIsLoading(true);
            const data: exportSalaryDataResponse | false = await ExportSalaryData({
                userId: id,
                userType: role,
                month,
                year,
                filter,
            });
            if (data) {
                const salaryData = data as exportSalaryDataResponse;
                const arrayBuffer = new Uint8Array(salaryData.buffer.data);

                // Convert ArrayBuffer to Blob
                const blob = new Blob([arrayBuffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });

                 const formattedMonth = typeof month === 'number' ? monthNames[month - 1] : month;
                 const fileName = `Salary_Details_${formattedMonth}_${year}.xlsx`;
                // Trigger download
                saveAs(blob, fileName);
            }
            setIsLoading(false);
        },
        [id, role]
    );

    return { loader: isLoading, getSalaryDetails };
}
