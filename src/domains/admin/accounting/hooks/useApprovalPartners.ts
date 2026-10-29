import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getApprovalPartners } from '../api/approvals';
import { ApprovalPartnersResponse } from '../types/approvals';

export default function useApprovalPartners(refreshToken = 0) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<ApprovalPartnersResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        const result = await getApprovalPartners({ userId: id, userType: role });
        setData(result || null);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        load();
    }, [load, refreshToken]);

    return {
        partners: data?.partners ?? [],
        totals: data?.totals ?? null,
        gate: data?.gate ?? null,
        isLoading,
        refetch: load,
    };
}
