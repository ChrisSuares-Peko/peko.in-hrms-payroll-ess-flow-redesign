import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    RequestReimbursementBody,
    cancelReimbursementApi,
    getMyReimbursements,
    requestReimbursementApi,
} from '../api/reimbursements';
import { ReimbursementRecord } from '../types';

const PAGE_SIZE = 10;

export const useReimbursements = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [records, setRecords] = useState<ReimbursementRecord[]>([]);
    const [total, setTotal] = useState(0);

    const fetchReimbursements = useCallback(
        async (params: { status?: string; from?: string; to?: string; page?: number } = {}) => {
            const response = await getMyReimbursements(
                { userType: role, userId: id },
                { ...params, page: params.page ?? 1, limit: PAGE_SIZE }
            );
            if (response) {
                setRecords(response.records);
                setTotal(response.total);
            }
        },
        [role, id]
    );

    const submitReimbursement = useCallback(
        async (body: RequestReimbursementBody) => {
            try {
                await requestReimbursementApi({ userType: role, userId: id }, body);
                await fetchReimbursements();
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
        [role, id, fetchReimbursements, dispatch]
    );

    const cancelReimbursement = useCallback(
        async (reimbursementId: string) => {
            try {
                await cancelReimbursementApi({ userType: role, userId: id }, reimbursementId);
                await fetchReimbursements();
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
        [role, id, fetchReimbursements, dispatch]
    );

    return {
        records,
        total,
        limit: PAGE_SIZE,
        fetchReimbursements,
        submitReimbursement,
        cancelReimbursement,
    };
};
