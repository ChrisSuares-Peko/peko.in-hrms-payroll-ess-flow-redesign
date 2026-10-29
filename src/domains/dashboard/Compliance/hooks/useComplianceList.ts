import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getComplianceListApi } from '../api';
import { ComplianceItem, useComplianceFilter } from '../types';

const defaultFilter: useComplianceFilter = {
    searchText: '',
    page: 1,
    pageSize: 10,
    from: '',
    to: '',
    status: '',
};

const useComplianceList = () => {
    const { id: userId, role: userType } = useAppSelector((state) => (state.reducer as any).auth);
    const [filter, setFilter] = useState<useComplianceFilter>(defaultFilter);
    const [data, setData] = useState<ComplianceItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchList = async () => {
            setLoading(true);
            const res = await getComplianceListApi({ userId, userType, ...filter });
            if (res) {
                setData(res.rows);
                setTotal(res.recordsTotal);
            }
            setLoading(false);
        };

        fetchList();
    }, [userId, userType, filter]);

    return { data, total, loading, filter, setFilter };
};

export default useComplianceList;
