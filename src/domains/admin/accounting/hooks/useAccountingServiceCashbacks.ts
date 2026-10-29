import { useCallback, useEffect, useState } from 'react';

import { getAllData } from '@src/domains/admin/settings/api/cashback';
import { newCashback, ServiceData } from '@src/domains/admin/settings/types/cashback';
import { useAppSelector } from '@src/hooks/store';

import {
    updateAccountingCashbackApi,
    updateAccountingServiceCashbackBulk,
    updateAccountingServiceCashbackStatus,
} from '../api/services';

type Filters = {
    searchText: string;
    page: number;
    itemsPerPage: number;
    sort: string;
    sortField?: string;
    partnerId?: string;
};

// Shared by both the Platform Fee and Cashbacks tabs — same cashback rows underlie both.
export default function useAccountingServiceCashbacks(
    serviceOperatorId: number | undefined,
    filters: Filters
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [rows, setRows] = useState<ServiceData[]>([]);
    const [count, setCount] = useState(0);
    const [refreshFlag, setRefreshFlag] = useState(false);

    const fetchRows = useCallback(async () => {
        if (!serviceOperatorId) {
            setRows([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const data = await getAllData({
            userId: id,
            userType: role,
            serviceOperatorId: String(serviceOperatorId),
            ...filters,
        });
        if (data) {
            setRows(data.data);
            setCount(data.recordsTotal);
        }
        setIsLoading(false);
    }, [id, role, serviceOperatorId, filters]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows, refreshFlag]);

    // Sends the full row back, not just the changed fields.
    const updateRow = useCallback(
        async (row: ServiceData, changes: Partial<newCashback>) => {
            const payload: newCashback = {
                id: row.id,
                packageId: String(row.packageId),
                serviceOperatorId: String(row.serviceOperatorId),
                cashbackType: row.cashbackType,
                cashback: row.cashback,
                surcharge: row.surcharge,
                surchargeType: row.surchargeType,
                unitPrice: row.unitPrice,
                baseLimit: row.baseLimit,
                ...changes,
            };
            const resp = await updateAccountingCashbackApi({
                userId: id,
                userType: role,
                ...payload,
            });
            if (resp && resp.status) {
                setRefreshFlag(f => !f);
                return true;
            }
            return false;
        },
        [id, role]
    );

    // Bulk-configure — one request updating every selected row's cashback/surcharge fields.
    const bulkUpdateRows = useCallback(
        async (
            ids: number[],
            changes:
                | Pick<newCashback, 'cashbackType' | 'cashback'>
                | Pick<newCashback, 'surchargeType' | 'surcharge'>
        ) => {
            const resp = await updateAccountingServiceCashbackBulk({
                userId: id,
                userType: role,
                ids,
                ...changes,
            });
            if (resp && resp.status) {
                setRefreshFlag(f => !f);
                return true;
            }
            return false;
        },
        [id, role]
    );

    const toggleSurchargeConfigured = useCallback(
        async (row: ServiceData) => {
            const resp = await updateAccountingServiceCashbackStatus({
                userId: id,
                userType: role,
                id: row.id,
                isSurchargeConfigured: !row.isSurchargeConfigured,
            });
            if (resp && resp.status) {
                setRefreshFlag(f => !f);
                return true;
            }
            return false;
        },
        [id, role]
    );

    return {
        isLoading,
        rows,
        count,
        updateRow,
        bulkUpdateRows,
        toggleSurchargeConfigured,
        refetch: () => setRefreshFlag(f => !f),
    };
}
