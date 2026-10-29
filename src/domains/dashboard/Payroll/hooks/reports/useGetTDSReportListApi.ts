import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getTDSReporList } from '../../api/reports/tds';
import { TDSReportItem } from '../../types/types';

const useGetTDSReportListApi = (month: number | string, year: number | string,regimeType:string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [tableDatas, setTableDatas] = useState<TDSReportItem[]>([]);
    const [tableLoading, setTableLoading] = useState(false);

    const getTDSReportList = useCallback(async () => {
        setTableLoading(true);
        const response = await getTDSReporList({
            userId: id,
            userType: role,
            month,
            year,
            regimeType
        });

        setTableDatas(response || []);
        setTableLoading(false);
    }, [id, role, month, year,regimeType]);

    useEffect(() => {
        if (id && role) {
            getTDSReportList();
        }
    }, [id, role, getTDSReportList]);

    return { tableDatas, tableLoading, getTDSReportList };
};

export default useGetTDSReportListApi;
