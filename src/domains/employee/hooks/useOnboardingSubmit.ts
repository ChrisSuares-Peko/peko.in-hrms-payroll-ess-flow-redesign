import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    RequiredOnboardingDocument,
    submitOnboardingBank,
    submitOnboardingDocuments,
    submitOnboardingEmergency,
} from '../api/onboarding';
import type { BankValues } from '../components/onboarding/BankStep';
import type { DocumentsValues } from '../components/onboarding/DocumentsStep';
import type { EmergencyValues } from '../components/onboarding/EmergencyContactStep';

// Submits each onboarding step (mapping FE field names to the BE contract); true on success.
export const useOnboardingSubmit = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const scope = { userType: role, userId: id };

    const run = async (fn: () => Promise<unknown>): Promise<boolean> => {
        try {
            await fn();
            return true;
        } catch (err: any) {
            dispatch(
                showToast({
                    description: err?.response?.data?.message || 'Something went wrong.',
                    variant: 'error',
                })
            );
            return false;
        }
    };

    // v is flat: `${key}` holds the base64 string, `${key}_format` holds the file extension
    // (this is FileUploadInput's convention — it writes to two separate top-level fields).
    const submitDocuments = (v: DocumentsValues, documents: RequiredOnboardingDocument[]) =>
        run(() => {
            const employeeDocuments = documents
                .filter(doc => v[doc.key] && v[`${doc.key}_format`])
                .map(doc => ({
                    key: doc.key,
                    name: doc.label,
                    url: { base64: v[doc.key], format: v[`${doc.key}_format`] },
                }));
            return submitOnboardingDocuments(scope, employeeDocuments);
        });

    const submitBank = (v: BankValues) =>
        run(() =>
            submitOnboardingBank(scope, {
                accountName: v.accountName,
                bankName: v.bankName,
                accountNumber: v.accountNumber,
                ifscCode: v.ifscCode.toUpperCase(),
                upiId: v.upiId || '',
            })
        );

    const submitEmergency = (v: EmergencyValues) =>
        run(() =>
            submitOnboardingEmergency(scope, {
                emergencyContactName: v.fullName,
                emergencyContactNo: v.phone,
                emergencyContactRelation: v.relationship || '',
            })
        );

    return { submitDocuments, submitBank, submitEmergency };
};
