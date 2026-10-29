import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPartnerApprovals } from '../api/approvals';
import { ApprovalRowsFilters, ApprovalRowsResponse } from '../types/approvals';

export default function useApprovalRows(
    partnerPermissionId: number | null,
    filters: ApprovalRowsFilters,
    refreshToken = 0
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<ApprovalRowsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { status, searchText } = filters;

    const load = useCallback(async () => {
        if (!partnerPermissionId) {
            setData(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const result = await getPartnerApprovals({
            userId: id,
            userType: role,
            partnerPermissionId,
            status,
            searchText,
        });
        setData(result || null);
        setIsLoading(false);
    }, [id, role, partnerPermissionId, status, searchText]);

    useEffect(() => {
        load();
    }, [load, refreshToken]);

    return {
        partner: data?.partner ?? null,
        rows: data?.rows ?? [],
        gate: data?.gate ?? null,
        isLoading,
        refetch: load,
    };
}
