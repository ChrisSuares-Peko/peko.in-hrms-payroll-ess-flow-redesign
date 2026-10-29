import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllData, resolveAccountNames, retryJournal } from '../api/orderJournal';
import { getData } from '../types';
import {
    JournalKey,
    JournalRetryResult,
    OrderJournalInfo,
    orderJournalResponse,
    RetryJournalPayload,
} from '../types/orderJournal';

const useOrderJournalData = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<OrderJournalInfo[]>();

    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: orderJournalResponse | false = await getAllData({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            setTableData(data.result);
            setCount(data.totalData);
        }
        setIsLoading(false);
        return data ? data.result : [];
    }, [id, payload, role]);

    useEffect(() => {
        getAllTableData();
    }, [getAllTableData]);

    // Re-fetches the table and returns the fresh rows, so callers (e.g. after a
    // successful retry) can pull the updated record for an already-open drawer
    // without waiting on React state to settle.
    const refresh = useCallback(() => getAllTableData(), [getAllTableData]);

    // Resolve provider account IDs -> COA names (for the journal drawer). Returns a map or {}.
    const resolveAccounts = async (accountIds: string[], corporateTxnId?: string) => {
        const result = await resolveAccountNames(
            { userId: id, userType: role },
            accountIds,
            corporateTxnId
        );
        return result || {};
    };

    const retry = async (
        corporateTxnId: string,
        journalKey: JournalKey,
        body: RetryJournalPayload
    ): Promise<JournalRetryResult | false> => {
        const result = await retryJournal({
            userId: id,
            userType: role,
            corporateTxnId,
            journalKey,
            ...body,
        });
        return result || false;
    };

    return { isLoading, tableData, count, resolveAccounts, refresh, retry };
};

export default useOrderJournalData;
