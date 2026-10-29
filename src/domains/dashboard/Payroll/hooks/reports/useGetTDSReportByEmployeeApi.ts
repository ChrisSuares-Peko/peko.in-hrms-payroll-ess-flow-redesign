import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getTDSReporListByEmployee } from '../../api/reports/tds';
import { TDSReportbyEmployee } from '../../types/types';


const useGetTDSReportByEmployeeApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [tdsEmployeeDetails, setTdsEmployeeDetails] = useState<TDSReportbyEmployee | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const getTDSReportByEmployee = useCallback(
        async (employeeId: string, month: number | string, year: number | string) => {
            setDetailsLoading(true);
            const response = await getTDSReporListByEmployee({
                userId: id,
                userType: role,
                month,
                year,
                eid: employeeId,
            });

            setTdsEmployeeDetails(response || null);
            
            setDetailsLoading(false);
        },
        [id, role]
    );

    return { tdsEmployeeDetails, detailsLoading, getTDSReportByEmployee };
};

export default useGetTDSReportByEmployeeApi;
