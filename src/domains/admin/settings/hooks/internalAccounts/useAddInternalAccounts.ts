import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { addInternalAccounts, getAllAccounts } from '../../api/internalAccounts';
import {
    AccountType,
    AddInternalAccountsPayload,
    ApiResponseAllAccounts,
} from '../../types/internalAccountsTypes';

const useAddInternalAccounts = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [allAccounts, setAllAccounts] = useState<AccountType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const getAllAccountsData = useCallback(async () => {
        setIsLoading(true);
        const data: ApiResponseAllAccounts | false = await getAllAccounts({
            userId: id,
            userType: role,
        });
        if (data) {
            setAllAccounts(data.allAccounts || []);
        } else {
            dispatch(
                showToast({
                    description: `Not able to fetch accounts`,
                    variant: 'error',
                })
            );
        }
        setIsLoading(false);
    }, [id, role, dispatch]);

    const createInternalAccounts = useCallback(
        async (payload: AddInternalAccountsPayload) => {
            setIsLoading(true);
            const data = await addInternalAccounts({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return true;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );

    useEffect(() => {
        getAllAccountsData();
    }, [getAllAccountsData]);

    return {
        isLoading,
        allAccounts,
        createInternalAccounts,
    };
};

export default useAddInternalAccounts;
