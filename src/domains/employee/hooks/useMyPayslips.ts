import { useEffect, useState } from 'react';

import { useEssAuth } from '@src/prototype/essSession';

import { getMyPayslips } from '../api/payslips';
import { PayslipRow } from '../types';

export const useMyPayslips = (year: string) => {
    // PROTOTYPE-SETUP: ESS identity comes from useEssAuth (DEMO_EMPLOYEE when there is no token).
    const { role, id } = useEssAuth();
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
