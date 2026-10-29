import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    AccountClosureRequest,
    ClosureReasonOption,
    getAccountClosure,
    submitAccountClosure,
} from '../../api/admin/accountClosureApi';
import { AccountClosureValues } from '../../schema/accountClosureSchema';

export const useAccountClosureApi = (enabled = true) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [request, setRequest] = useState<AccountClosureRequest | null>(null);
    const [reasons, setReasons] = useState<ClosureReasonOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);

    const fetchClosure = useCallback(async () => {
        if (!enabled) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const res = await getAccountClosure(role, id);
        if (res && res.data) {
            setRequest(res.data.request);
            setReasons(res.data.reasons ?? []);
        }
        setIsLoading(false);
    }, [enabled, role, id]);

    useEffect(() => {
        fetchClosure();
    }, [fetchClosure]);

    const submit = async (values: AccountClosureValues) => {
        setSubmitLoading(true);
        const details = values.details.trim();
        const res = await submitAccountClosure(role, id, {
            reason: values.reason,
            ...(details ? { details } : {}),
        });
        setSubmitLoading(false);
        if (!res) return false;
        setRequest(res.data?.request ?? null);
        dispatch(
            showToast({
                variant: 'success',
                description:
                    'Your account closure request has been submitted. Our support team will be in touch.',
            })
        );
        return true;
    };

    return {
        request,
        reasons,
        isLoading,
        submit,
        submitLoading,
        hasPendingRequest: request?.status === 'PENDING',
    };
};
