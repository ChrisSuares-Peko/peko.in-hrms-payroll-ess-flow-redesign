import { useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getPaymentOnboardingStatus,
    savePaymentOnboardingBankApi,
    savePaymentOnboardingPanApi,
    savePaymentOnboardingStep1Api,
    savePaymentOnboardingStep2Api,
    verifyBankApi,
} from '../api/onboarding';
import { VirtualAccount, VirtualAccountResponse } from '../types/ManageBankAccounts';
import {
    BankAccountFormValues,
    BankVerificationFormValues,
    CurrencyAccountBusinessData,
    VerifiedBankData,
} from '../types/onboarding';

const useOnboarding = (type: 'payment-link' | 'currency-account' = 'payment-link') => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isSavingStep1, setIsSavingStep1] = useState(false);
    const [isSavingPan, setIsSavingPan] = useState(false);
    const [isSavingBank, setIsSavingBank] = useState(false);
    const [isActivating, setIsActivating] = useState(false);

    const saveStep1 = async (data: CurrencyAccountBusinessData): Promise<boolean> => {
        if (type !== 'payment-link') return true;
        setIsSavingStep1(true);
        try {
            const resp = await savePaymentOnboardingStep1Api({
                userId,
                userType,
                businessName: data.businessName,
                bankName: data.bankName,
                accountNumber: data.accountNumber,
                ifsc: data.ifsc,
            });
            if (!resp || !resp.status) {
                if (!resp) {
                    dispatch(
                        showToast({
                            description: 'Failed to save business details.',
                            variant: 'error',
                        })
                    );
                }
                return false;
            }
            return true;
        } finally {
            setIsSavingStep1(false);
        }
    };

    const savePanStep = async (pan: string): Promise<string | null> => {
        if (type !== 'payment-link') return '';
        setIsSavingPan(true);
        try {
            const resp = await savePaymentOnboardingPanApi({ userId, userType, pan });
            if (!resp || !resp.status) {
                if (!resp) {
                    dispatch(showToast({ description: 'Failed to verify PAN.', variant: 'error' }));
                }
                return null;
            }
            return resp.data?.phone ?? '';
        } finally {
            setIsSavingPan(false);
        }
    };

    const saveBankStep = async (
        data: BankVerificationFormValues & { bankName: string }
    ): Promise<VerifiedBankData | null> => {
        if (type !== 'payment-link') return { ...data, accountHolderName: data.name };
        setIsSavingBank(true);
        try {
            const resp = await savePaymentOnboardingBankApi({ userId, userType, ...data });
            if (!resp || !resp.status) {
                if (!resp) {
                    dispatch(
                        showToast({
                            description: 'Failed to verify bank account.',
                            variant: 'error',
                        })
                    );
                }
                return null;
            }
            return {
                bankName: resp.data?.bankName || data.bankName,
                accountNumber: resp.data?.accountNumber || data.accountNumber,
                ifsc: resp.data?.ifsc || data.ifsc,
                accountHolderName: resp.data?.accountHolderName || data.name,
                phone: resp.data?.phone || data.phone,
            };
        } finally {
            setIsSavingBank(false);
        }
    };

    const activateNow = async (_data: CurrencyAccountBusinessData): Promise<string | null> => {
        if (type !== 'payment-link') return '';
        setIsActivating(true);
        try {
            const resp = await savePaymentOnboardingStep2Api({
                userId,
                userType,
                consentAccepted: true,
            });
            if (!resp || !resp.status) {
                if (!resp) {
                    dispatch(showToast({ description: 'Activation failed.', variant: 'error' }));
                }
                return null;
            }
            return resp.data?.virtualAccountNumber || '';
        } finally {
            setIsActivating(false);
        }
    };

    const verifyBankStep = async (values: BankAccountFormValues): Promise<boolean> => {
        if (type !== 'payment-link') return true;
        const resp = await verifyBankApi({ userId, userType, ...values });
        if (!resp || !resp.status) {
            if (!resp) {
                dispatch(
                    showToast({ description: 'Failed to verify bank account.', variant: 'error' })
                );
            }
            return false;
        }
        return true;
    };

    const checkOnboardingStatus = async (): Promise<{
        isOnboarded: boolean;
        bankDetails: VirtualAccount | null;
        record: VirtualAccountResponse | null;
    }> => {
        const resp = await getPaymentOnboardingStatus({ userId, userType });
        // Onboarded only when the NuPay record is active. Keying on status (not activatedAt) matters:
        // a Decentro→NuPay merchant keeps a stale activatedAt while status is still approval-pending
        // (no credentials yet), so activatedAt would wrongly pass during that window.
        const isOnboarded = !!(resp && resp.status && resp.data?.status === 'active' && resp.data?.vendor === 'nupay');
        if (!isOnboarded) {
            return { isOnboarded: false, bankDetails: null, record: resp ? resp.data ?? null : null };
        }
        const d = resp!.data!;
        return {
            isOnboarded: true,
            record: d,
            bankDetails: {
                id: String(d.id ?? '1'),
                name: d.businessName || '',
                bankName: d.bankName || '',
                accountNumber: d.virtualAccountNumber || '',
                ifsc: d.ifsc || '',
                currency: 'INR',
                type: 'Domestic',
            },
        };
    };

    return {
        isSavingStep1,
        isSavingPan,
        isSavingBank,
        isActivating,
        saveStep1,
        savePanStep,
        saveBankStep,
        verifyBankStep,
        activateNow,
        checkOnboardingStatus,
    };
};

export default useOnboarding;
