import { useCallback, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppSelector } from '@src/hooks/store';

import { getPayrollHistoryExcel } from '../../../api/employeeSalaryApi/employeeSalary';
import { payrollHistoryExcelResponse } from '../../../types/salaryProfileTypes/employeeSalaryTable';

const getFileExtension = (fileType: string) => {
    if (!fileType) return 'xlsx';

    if (fileType.includes('csv')) return 'csv';
    if (fileType.includes('pdf')) return 'pdf';
    if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('xlsx')) {
        return 'xlsx';
    }

    return 'xlsx';
};

export const useExportPayrollHistoryApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [exportLoading, setExportLoading] = useState(false);

    const exportPayrollHistory = useCallback(
        async (year: number | string) => {
            setExportLoading(true);
            const response = (await getPayrollHistoryExcel({
                userId: id,
                userType: role,
                year,
            })) as payrollHistoryExcelResponse | false;

            if (!response) {
                setExportLoading(false);
                return {
                    status: false,
                    message: 'Unable to export payroll history. Please try again.',
                };
            }

            if (!response.status || !response.data?.buffer?.data) {
                setExportLoading(false);
                return {
                    status: false,
                    message: response.message || 'No payroll history available for export',
                };
            }

            const fileType = response.data.fileType ||
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            const fileExtension = getFileExtension(fileType);
            const byteArray = new Uint8Array(response.data.buffer.data);
            const blob = new Blob([byteArray], { type: fileType });

            saveAs(blob, `Payroll_History_${year}.${fileExtension}`);

            setExportLoading(false);
            return {
                status: true,
                message: response.message || 'Payroll history exported successfully.',
            };
        },
        [id, role]
    );

    return { exportLoading, exportPayrollHistory };
};
