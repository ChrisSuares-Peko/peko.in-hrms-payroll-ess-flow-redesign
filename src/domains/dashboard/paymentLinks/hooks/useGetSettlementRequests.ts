import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getSettlementRequests } from '../api';
import type { SettlementRequestRow } from '../types/paymentLinkTypes';

function mapDbRowToSettlementRequestRow(row: any): SettlementRequestRow {
    return {
        key: row.id,
        requestId: row.reference_id ?? row.referenceId ?? row.id,
        requestedOn: row.created_at ?? row.createdAt ?? new Date().toISOString(),
        amount: Number(row.amount ?? 0),
        remarks: row.metadata?.remarks ?? '',
        status: row.status ?? 'PENDING',
    };
}

export default function useGetSettlementRequests() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setIsLoading] = useState(false);
    const [requests, setRequests] = useState<SettlementRequestRow[]>([]);

    const fetchRequests = useCallback(async () => {
        setIsLoading(true);
        const data = await getSettlementRequests({ userId: id, userType: role, page: 1, limit: 50 });
        setIsLoading(false);
        if (data) {
            setRequests((data.rows ?? []).map(mapDbRowToSettlementRequestRow));
        }
    }, [id, role]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    return { isLoading, requests, refetch: fetchRequests };
}
