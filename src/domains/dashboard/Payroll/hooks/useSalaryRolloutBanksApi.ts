import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    addSalaryRolloutBankApi,
    deleteSalaryRolloutBankApi,
    listSalaryRolloutBanksApi,
    setPrimaryBankApi,
    updateSalaryRolloutBankApi,
} from '../api/bankAccount';
import { SalaryRolloutBankAccount, SalaryRolloutBankPayload } from '../types/bankAccount';

export default function useSalaryRolloutBanksApi() {
    const { id, role } = useAppSelector((state) => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [accounts, setAccounts] = useState<SalaryRolloutBankAccount[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        const data = await listSalaryRolloutBanksApi({ userId: id, userType: role });
        setIsLoading(false);
        if (data) setAccounts(data);
    },[id, role]);

    const add = async (payload: SalaryRolloutBankPayload): Promise<boolean> => {
        setIsLoading(true);
        const data = await addSalaryRolloutBankApi({ userId: id, userType: role, ...payload });
        setIsLoading(false);
        if (data) {
            dispatch(showToast({ description: 'Bank account added successfully', variant: 'success' }));
            await fetchAll();
            return true;
        }
        return false;
    };

    const update = async (accountId: string, payload: SalaryRolloutBankPayload): Promise<boolean> => {
        setIsLoading(true);
        const data = await updateSalaryRolloutBankApi({ userId: id, userType: role, id: accountId, ...payload });
        setIsLoading(false);
        if (data) {
            dispatch(showToast({ description: 'Bank account updated successfully', variant: 'success' }));
            await fetchAll();
            return true;
        }
        return false;
    };

    const remove = async (accountId: string): Promise<boolean> => {
        setIsLoading(true);
        const ok = await deleteSalaryRolloutBankApi({ userId: id, userType: role, id: accountId });
        setIsLoading(false);
        if (ok) {
            dispatch(showToast({ description: 'Bank account deleted successfully', variant: 'success' }));
            await fetchAll();
            return true;
        }
        return false;
    };

    const setPrimary = async (accountId: string): Promise<boolean> => {
        setIsLoading(true);
        const data = await setPrimaryBankApi({ userId: id, userType: role, id: accountId });
        setIsLoading(false);
        if (data) {
            await fetchAll();
            return true;
        }
        return false;
    };

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    return { accounts, isLoading, add, update, remove, setPrimary, refetch: fetchAll };
}
