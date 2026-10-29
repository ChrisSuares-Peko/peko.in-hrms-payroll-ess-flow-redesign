import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchDashboardDetails } from '../api';
import { PayoutDashboardData } from '../types';

export default function useDashBoardDetailsApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setLoading] = useState(false);
    const [data, setData] = useState<PayoutDashboardData | null>(null);

    const getDashboardDetails = async () => {
        setLoading(true);
        const res: PayoutDashboardData | false = await fetchDashboardDetails({
            userId: id,
            userType: role,
        });
        if (res) {
            setData(res);
        }
        setLoading(false);
    };

    return { getDashboardDetails, data, isLoading };
}
