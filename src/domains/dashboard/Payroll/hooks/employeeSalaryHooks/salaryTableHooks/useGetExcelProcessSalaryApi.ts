import { useCallback, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppSelector } from '@src/hooks/store';

import { geProcessSalaryExcelDetails } from '../../../api/employeeSalaryApi/SalaryProfileApi';

export const useGetExcelProcessSalaryApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<any | null>(null);

    const getExcelProcessSalaryList = useCallback(
        async (month: any, year: any) => {
            setIsLoading(true);
            const response = await geProcessSalaryExcelDetails({
                userId: id,
                userType: role,
                month,
                year,
            });

            if (response !== null) {
                const byteArray = new Uint8Array(response);
                const blob = new Blob([byteArray], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });
                saveAs(blob, `ProcessSalary_${month}_${year}.xlsx`);
                setData(response);
                setIsLoading(false);
            } else {
                setIsLoading(false);
            }
        },
        [id, role]
    );

    return { data, isLoading, getExcelProcessSalaryList };
};
