import { useCallback, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { verifyCustomerBankApi } from '../../api/customers';
import { BankAccountFormValues } from '../../types/customer';

const useVerifyCustomerBank = () => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isVerifying, setIsVerifying] = useState(false);

    const verifyBankAccount = useCallback(
        async (values: BankAccountFormValues): Promise<BankAccountFormValues | null> => {
            setIsVerifying(true);
            try {
                const resp = await verifyCustomerBankApi({
                    userId,
                    userType,
                    bank_account: values.accountNumber,
                    ifsc: values.ifscCode,
                    name: values.accountHolderName,
                });

                if (!resp || !resp.status) {
                    dispatch(
                        showToast({
                            description:
                                (resp && 'message' in resp && (resp as any).message) ||
                                'Failed to verify bank account.',
                            variant: 'error',
                        })
                    );
                    return null;
                }

                return {
                    ...values,
                    verifyToken: resp.data.verifyToken,
                    ifsc_details: resp.data?.ifsc_details,
                };
            } finally {
                setIsVerifying(false);
            }
        },
        [dispatch, userId, userType]
    );

    return { verifyBankAccount, isVerifying };
};

export default useVerifyCustomerBank;
