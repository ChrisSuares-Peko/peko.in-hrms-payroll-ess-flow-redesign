import { useCallback, useState } from 'react';
 
import { useAppSelector } from '@src/hooks/store';
 
import {
    getOnboardingStatus,
    saveOnboardingBankStep,
    saveOnboardingPanStep,
    saveOnboardingStep1,
    saveOnboardingStep2,
} from '../api';

 
type Step1Input = {
    businessName: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
};
 
type PanStepInput = {
    pan: string;
};
 
type BankStepInput = {
    accountNumber: string;
    ifsc: string;
    bankName?: string;
    name: string;
    phone: string;
};
type OnboardingRecord ={
    id: number;
    credentialId: number;
    status: 'pending' | 'active' | 'suspended' | 'rejected';
    businessName: string;
    bankName: string | null;
    accountNumber: string | null;
    ifsc: string | null;
    virtualAccountId: string | null;
    virtualAccountNumber: string | null;
    virtualIfsc: string | null;
    consentAcceptedAt: string | null;
    activatedAt: string | null;
    createdAt: string;
    updatedAt: string;
}
 
export const usePaymentLinkOnboarding = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);
    const [record, setRecord] = useState<OnboardingRecord | null>(null);
 
    const fetchStatus = useCallback(async () => {
        setLoading(true);
        const result = await getOnboardingStatus({ userId: id, userType: role });
        setLoading(false);
        if (result !== false) setRecord(result);
        return result;
    }, [id, role]);
 
    const submitStep1 = useCallback(
        async (payload: Step1Input) => {
            setLoading(true);
            const result = await saveOnboardingStep1({ userId: id, userType: role, ...payload });
            fetchStatus();
            setLoading(false);
            if (result !== false) setRecord(result);
            return result;
        },
        [fetchStatus, id, role]
    );
 
    const submitPanStep = useCallback(
        async (payload: PanStepInput) => {
            setLoading(true);
            const result = await saveOnboardingPanStep({ userId: id, userType: role, ...payload });
            setLoading(false);
            if (result !== false) setRecord(result);
            return result;
        },
        [id, role]
    );
 
    const submitBankStep = useCallback(
        async (payload: BankStepInput) => {
            setLoading(true);
            const result = await saveOnboardingBankStep({ userId: id, userType: role, ...payload });
            setLoading(false);
            if (result !== false) setRecord(result);
            return result;
        },
        [id, role]
    );
 
    const submitStep2 = useCallback(async () => {
        setLoading(true);
        const result = await saveOnboardingStep2({
            userId: id,
            userType: role,
            consentAccepted: true,
        });
        fetchStatus();
        setLoading(false);
        if (result !== false) setRecord(result);
        return result;
    }, [fetchStatus, id, role]);
 
    return {
        loading,
        record,
        fetchStatus,
        submitStep1,
        submitPanStep,
        submitBankStep,
        submitStep2,
    };
};
 