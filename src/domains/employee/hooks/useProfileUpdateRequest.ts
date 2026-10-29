import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    BankUpdatePayload,
    ProfileUpdatePayload,
    requestBankUpdate,
    requestProfileUpdate,
} from '../api/profileUpdateRequest';

// Submits a profile/bank update request (mirrors useOnboardingSubmit.ts's run/scope pattern); true on success.
export const useProfileUpdateRequest = () => {
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

    const submitProfileUpdate = (values: ProfileUpdatePayload) =>
        run(() => requestProfileUpdate(scope, values));

    const submitBankUpdate = (values: BankUpdatePayload) =>
        run(() => requestBankUpdate(scope, values));

    return { submitProfileUpdate, submitBankUpdate };
};
