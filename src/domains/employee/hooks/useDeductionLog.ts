import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getDeductionLog } from '../api/deductionLog';
import { raiseDisputeApi } from '../api/disputes';
import { DeductionLogRecord } from '../types';

const PAGE_SIZE = 10;

export const useDeductionLog = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [records, setRecords] = useState<DeductionLogRecord[]>([]);
    const [total, setTotal] = useState(0);

    const fetchLog = useCallback(
        async (params: { page?: number } = {}) => {
            const { records: fetched, total: fetchedTotal } = await getDeductionLog(
                { userType: role, userId: id },
                { page: params.page ?? 1, limit: PAGE_SIZE }
            );
            setRecords(fetched);
            setTotal(fetchedTotal);
        },
        [role, id]
    );

    const raiseDispute = useCallback(
        async (recordId: string, reason: string) => {
            try {
                await raiseDisputeApi(
                    { userType: role, userId: id },
                    { attendanceId: recordId, reason }
                );
                await fetchLog();
                return true;
            } catch (err: any) {
                dispatch(
                    showToast({
                        description: err?.response?.data?.message || 'Something went wrong.',
                        variant: 'error',
                    })
                );
                return false;
            }
        },
        [role, id, fetchLog, dispatch]
    );

    return { records, total, limit: PAGE_SIZE, fetchLog, raiseDispute };
};
