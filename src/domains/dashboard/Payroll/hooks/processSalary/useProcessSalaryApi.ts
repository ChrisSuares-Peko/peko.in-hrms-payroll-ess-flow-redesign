import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { processSalaryApi } from '../../api/processSalary';
import { ProcessSalaryResponse } from '../../types/processSalary';
import { invalidateDashboardCache } from '../dashboardHooks/useDashboardApi';

type ProcessSalaryArgs = {
    month: number;
    year: number;
    salaryIds: string[];
    remarks?: string;
};

type ProcessSalaryErrorEnvelope = {
    message?: string;
    error?: { message?: string };
    data?: { error?: { message?: string } };
};

const extractFailureMessage = (
    resp: ProcessSalaryResponse
): string | null => {
    const envelope = resp as ProcessSalaryResponse & ProcessSalaryErrorEnvelope;

    const inlineError =
        envelope.error?.message || envelope.data?.error?.message;
    if (inlineError) return inlineError;

    const allFailed =
        typeof envelope.failedCount === 'number' &&
        envelope.failedCount > 0 &&
        (envelope.successCount ?? 0) === 0 &&
        (envelope.initiatedCount ?? 0) === 0;
    if (allFailed) {
        const firstFailed = envelope.results?.find(
            r => r.status === 'FAILED'
        );
        return (
            firstFailed?.message ||
            envelope.message ||
            'Salary processing failed'
        );
    }

    if (!envelope.batchReferenceId) {
        return envelope.message || 'Salary processing failed';
    }

    return null;
};

export const useProcessSalaryApi = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<ProcessSalaryResponse | null>(null);

    const processSalary = async (
        args: ProcessSalaryArgs
    ): Promise<ProcessSalaryResponse | false> => {
        setIsProcessing(true);
        const resp = await processSalaryApi({
            userId: id,
            userType: role,
            ...args,
        });
        setIsProcessing(false);

        if (!resp) return false;

        const failureMessage = extractFailureMessage(resp);
        if (failureMessage) {
            dispatch(
                showToast({
                    description: failureMessage,
                    variant: 'error',
                })
            );
            return false;
        }

        setResult(resp);
        invalidateDashboardCache();
        dispatch(
            showToast({
                description: 'Salary processing initiated successfully',
                variant: 'success',
            })
        );
        return resp;
    };

    return { processSalary, isProcessing, result };
};
