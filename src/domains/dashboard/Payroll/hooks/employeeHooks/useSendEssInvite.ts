import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { useUpdateEmployeeApiNew } from './useUpdateEmployeeApiNew';
import { confirmJoiningApi } from '../../api/employeeApi';
import { createEmployeeUser, updateEssEmail } from '../../api/essInvite';

// Sends the ESS portal invite to an already-active employee. Reuses
// createEmployeeUser (creates the USER login + set-password email), then
// confirms joining for the payroll employee.
export const useSendEssInvite = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const { updateWorkEmail } = useUpdateEmployeeApiNew();
    const [isSending, setIsSending] = useState(false);
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

    const sendInvite = async ({
        name,
        email,
        mobileNo,
        employeeId,
    }: {
        name: string;
        email: string;
        mobileNo?: string;
        employeeId?: string;
    }): Promise<boolean> => {
        setIsSending(true);
        try {
            const res = await createEmployeeUser({
                name,
                email,
                mobileNo: mobileNo || undefined,
                employeeId,
            });
            if (!res) {
                dispatch(
                    showToast({ description: 'Failed to send ESS invite.', variant: 'error' })
                );
                return false;
            }

            // Confirm joining for the payroll employee once the login is created.
            if (employeeId) {
                const joinRes = await confirmJoiningApi({
                    userId: id,
                    userType: role,
                    employeeId,
                });
                if (!joinRes.success) {
                    dispatch(
                        showToast({
                            description:
                                joinRes.errorMessage ||
                                'Invite sent, but confirming joining failed.',
                            variant: 'error',
                        })
                    );
                    return false;
                }
            }

            dispatch(
                showToast({
                    // The API says what happened (new invite, resent invite, or a rehire's existing login restored).
                    description: res.message || 'ESS onboarding invite sent to the employee.',
                    variant: 'success',
                })
            );
            return true;
        } catch (err: any) {
            dispatch(
                showToast({
                    description: err?.response?.data?.message || 'Something went wrong.',
                    variant: 'error',
                })
            );
            return false;
        } finally {
            setIsSending(false);
        }
    };

    // Updates the login email for an employee already invited to ESS, then
    // syncs the same value onto the payroll record's workEmailId.
    const updateEmail = async ({
        employeeId,
        email,
    }: {
        employeeId: string;
        email: string;
    }): Promise<boolean> => {
        setIsUpdatingEmail(true);
        try {
            const res = await updateEssEmail({ employeeId, email });
            if (!res.success) {
                dispatch(
                    showToast({
                        description: res.errorMessage || 'Failed to update the work email.',
                        variant: 'error',
                    })
                );
                return false;
            }

            const synced = await updateWorkEmail({ id: employeeId, workEmailId: email });
            if (!synced) return false;

            dispatch(
                showToast({
                    description: 'Work email updated successfully.',
                    variant: 'success',
                })
            );
            return true;
        } finally {
            setIsUpdatingEmail(false);
        }
    };

    return { sendInvite, isSending, updateEmail, isUpdatingEmail };
};
