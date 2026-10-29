import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    addBankAccountApi,
    deleteBankAccountApi,
    editBankAccountApi,
    getBankAccountsApi,
    sendBankAccountOtpApi,
    setPrimaryBankAccountApi,
} from '../../api/manageBankAccount';
import { AddDomesticAccountFormValues, DomesticAccount } from '../../types/ManageBankAccounts';

const useDomesticAccounts = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [accounts, setAccounts] = useState<DomesticAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const resp = await getBankAccountsApi({ userId: id, userType: role });
        if (resp && resp.status) {
            setAccounts(resp.data ?? []);
        } else if (resp && !resp.status) {
            dispatch(showToast({ description: resp.message, variant: 'error' }));
        }
        setIsLoading(false);
    }, [id, role, dispatch]);

    const addDomesticAccount = useCallback(
        async (values: AddDomesticAccountFormValues, otp: string, onSuccess?: () => void) => {
            setIsLoading(true);
            const resp = await addBankAccountApi({ userId: id, userType: role, ...values, otp });
            if (resp && resp.status) {
                dispatch(
                    showToast({
                        description: resp.message || 'Bank account added successfully.',
                        variant: 'success',
                    })
                );
                onSuccess?.();
                fetchData();
                setIsLoading(false);
                return true;
            } if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setIsLoading(false);
            return false;
        },
        [id, role, dispatch, fetchData]
    );

    const editDomesticAccount = useCallback(
        async (accountId: string, values: AddDomesticAccountFormValues, otp: string, onSuccess?: () => void) => {
            setIsLoading(true);
            const existing = accounts.find(a => String(a.id) === accountId);
            const resp = await editBankAccountApi({
                userId: id,
                userType: role,
                accountId,
                ...values,
                otp,
                isDefault: existing?.default === 1,
            });
            if (resp && resp.status) {
                dispatch(
                    showToast({
                        description: resp.message || 'Bank account updated successfully.',
                        variant: 'success',
                    })
                );
                onSuccess?.();
                fetchData();
                setIsLoading(false);
                return true;
            } if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setIsLoading(false);
            return false;
        },
        [id, role, dispatch, fetchData, accounts]
    );

    const setAsPrimary = useCallback(
        async (accountId: string, otp: string) => {
            const account = accounts.find(a => String(a.id) === accountId);
            if (!account) return false;
            const resp = await setPrimaryBankAccountApi({ userId: id, userType: role, account, otp });
            if (resp && resp.status) {
                dispatch(
                    showToast({ description: resp.message || 'Primary account updated.', variant: 'success' })
                );
                fetchData();
                return true;
            } if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            return false;
        },
        [id, role, dispatch, fetchData, accounts]
    );

    const sendOtpForBankAccount = useCallback(
        async (accountNumber: string, selectedId?: string, method?: string) => {
            const resp = await sendBankAccountOtpApi({ userId: id, userType: role, accountNumber, selectedId, method });
            if (resp && resp.status) return true;
            if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            return false;
        },
        [id, role, dispatch]
    );

    const deleteDomesticAccount = useCallback(
        async (accountId: string, otp: string, onSuccess?: () => void) => {
            setIsLoading(true);
            const resp = await deleteBankAccountApi({ userId: id, userType: role, accountId, otp });
            if (resp && resp.status) {
                dispatch(
                    showToast({
                        description: resp.message || 'Bank account deleted successfully.',
                        variant: 'success',
                    })
                );
                onSuccess?.();
                fetchData();
                setIsLoading(false);
                return true;
            } if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setIsLoading(false);
            return false;
        },
        [id, role, dispatch, fetchData]
    );

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        accounts,
        isLoading,
        fetchData,
        addDomesticAccount,
        editDomesticAccount,
        deleteDomesticAccount,
        setAsPrimary,
        sendOtpForBankAccount,
    };
};

export default useDomesticAccounts;
