import { useCallback, useRef, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    addDomesticBankApi,
    getBankDetailsOtpApi,
    getPrimaryBankApi,
} from '../../api/collectPayment';
import { AddDomesticBankValues } from '../../types/CollectPayment';

type PrimaryBank = Awaited<ReturnType<typeof getPrimaryBankApi>>;

const useBankDetails = () => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const cache = useRef<PrimaryBank>(undefined);
    const [primaryBank, setPrimaryBank] = useState<PrimaryBank>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const fetchDetails = useCallback(
        async (force = false): Promise<PrimaryBank> => {
            if (!force && cache.current !== undefined) {
                setPrimaryBank(cache.current);
                return cache.current;
            }
            setIsFetching(true);
            try {
                const bank = await getPrimaryBankApi({ userId, userType });
                cache.current = bank;
                setPrimaryBank(bank);
                return bank;
            } finally {
                setIsFetching(false);
            }
        },
        [userId, userType]
    );

    const sendOtp = useCallback(
        async (accountNumber: string): Promise<boolean> => {
            setIsSendingOtp(true);
            try {
                const resp = await getBankDetailsOtpApi({ userId, userType, accountNumber });
                return !!resp;
            } finally {
                setIsSendingOtp(false);
            }
        },
        [userId, userType]
    );

    const addAccount = useCallback(
        async (values: AddDomesticBankValues, otp: string, onSuccess: () => void) => {
            setIsAdding(true);
            try {
                const resp = await addDomesticBankApi({
                    userId,
                    userType,
                    accountHolderName: values.accountHolderName,
                    accountNumber: values.accountNumber,
                    accountType: values.accountType,
                    bankBranch: values.bankBranch,
                    bankName: values.bankName,
                    default: false,
                    ifscCode: values.ifscCode,
                    otp,
                });
                if (resp) {
                    dispatch(
                        showToast({
                            description: 'Bank account added successfully.',
                            variant: 'success',
                        })
                    );
                    cache.current = undefined;
                    onSuccess();
                } else {
                    dispatch(
                        showToast({ description: 'Failed to add bank account.', variant: 'error' })
                    );
                }
            } finally {
                setIsAdding(false);
            }
        },
        [userId, userType, dispatch]
    );

    return { primaryBank, isFetching, isSendingOtp, isAdding, fetchDetails, sendOtp, addAccount };
};

export default useBankDetails;
