import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getMyPayslips } from '../api/payslips';
import { PayslipRow } from '../types';

export const useMyPayslips = (year: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<PayslipRow[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        getMyPayslips({ userType: role, userId: id }, { year }).then(data => {
            setRows(data ? data.rows : []);
            setLoading(false);
        });
    }, [role, id, year]);

    return { rows, loading };
};
