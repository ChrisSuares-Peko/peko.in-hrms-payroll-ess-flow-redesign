import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { verifyBankAccountApi } from '../api/bankAccount';
import { BankAccountRecord, VerifyBankAccountPayload } from '../types/bankAccount';

export default function useBankAccountApi() {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const verify = async (
        values: VerifyBankAccountPayload
    ): Promise<BankAccountRecord | false> => {
        setIsLoading(true);
        const resp = await verifyBankAccountApi({
            ...values,
            userId: id,
            userType: role,
        });
        setIsLoading(false);

        if (resp) {
            dispatch(
                showToast({
                    description: 'Bank account verified successfully',
                    variant: 'success',
                })
            );
        }
        return resp;
    };

    return { verify, isLoading };
}
