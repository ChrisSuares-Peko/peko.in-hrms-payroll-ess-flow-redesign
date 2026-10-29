import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    createAccountingCashbackApi,
    updateAccountingCashbackApi,
    updateAccountingServiceCashbackBulk,
} from '../api/services';
import {
    getSubscriptionAddOns,
    SubscriptionAddOnKind,
    SubscriptionAddOnRow,
} from '../api/subscriptionAddOns';

type AddonFilters = {
    searchText: string;
    page: number;
    itemsPerPage: number;
    partnerId?: string;
    kind?: SubscriptionAddOnKind;
};

type AddonPriceChanges = {
    unitPrice: string;
    baseLimit: string;
};

const DEFAULT_CASHBACK_FIELDS = {
    cashbackType: 'FLAT',
    cashback: '0',
    surchargeType: 'FLAT',
    surcharge: '0',
};

// Peko Subscriptions' Add-ons tab — every eligible package, configured or not.
export default function usePekoSubscriptionAddons(filters: AddonFilters) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [rows, setRows] = useState<SubscriptionAddOnRow[]>([]);
    const [count, setCount] = useState(0);
    const [refreshFlag, setRefreshFlag] = useState(false);

    const fetchRows = useCallback(async () => {
        setIsLoading(true);
        const data = await getSubscriptionAddOns({ userId: id, userType: role, ...filters });
        if (data) {
            setRows(data.data);
            setCount(data.recordsTotal);
        }
        setIsLoading(false);
    }, [id, role, filters]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows, refreshFlag]);

    // Existing rows are updated in place; unconfigured ones (no cashbackId) are created.
    const saveRow = useCallback(
        async (row: SubscriptionAddOnRow, changes: AddonPriceChanges) => {
            const resp = row.cashbackId
                ? await updateAccountingCashbackApi({
                      userId: id,
                      userType: role,
                      id: row.cashbackId,
                      packageId: String(row.packageId),
                      serviceOperatorId: String(row.serviceOperatorId),
                      cashbackType: row.cashbackType || DEFAULT_CASHBACK_FIELDS.cashbackType,
                      cashback: row.cashback || DEFAULT_CASHBACK_FIELDS.cashback,
                      surchargeType: row.surchargeType || DEFAULT_CASHBACK_FIELDS.surchargeType,
                      surcharge: row.surcharge || DEFAULT_CASHBACK_FIELDS.surcharge,
                      ...changes,
                  })
                : await createAccountingCashbackApi({
                      userId: id,
                      userType: role,
                      packageId: String(row.packageId),
                      serviceOperatorId: String(row.serviceOperatorId),
                      ...DEFAULT_CASHBACK_FIELDS,
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

    // Existing rows: one bulk PUT. Unconfigured rows: created individually (no id to update).
    const bulkSaveRows = useCallback(
        async (rowsToSave: SubscriptionAddOnRow[], changes: AddonPriceChanges) => {
            const existingIds = rowsToSave
                .filter(row => row.cashbackId)
                .map(row => row.cashbackId as number);
            const newRows = rowsToSave.filter(row => !row.cashbackId);

            const bulkUpdateResp = existingIds.length
                ? await updateAccountingServiceCashbackBulk({
                      userId: id,
                      userType: role,
                      ids: existingIds,
                      ...changes,
                  })
                : true;

            const createResps = await Promise.all(
                newRows.map(row =>
                    createAccountingCashbackApi({
                        userId: id,
                        userType: role,
                        packageId: String(row.packageId),
                        serviceOperatorId: String(row.serviceOperatorId),
                        ...DEFAULT_CASHBACK_FIELDS,
                        ...changes,
                    })
                )
            );

            const success =
                (bulkUpdateResp === true || Boolean(bulkUpdateResp && bulkUpdateResp.status)) &&
                createResps.every(resp => Boolean(resp && resp.status));
            if (success) setRefreshFlag(f => !f);
            return success;
        },
        [id, role]
    );

    return {
        isLoading,
        rows,
        count,
        saveRow,
        bulkSaveRows,
        refetch: () => setRefreshFlag(f => !f),
    };
}
