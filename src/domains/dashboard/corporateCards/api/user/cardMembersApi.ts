import { SuccessGenericResponse } from '@customtypes/general';
import { FRONTEND_BASE_URL } from '@src/config-global';
import { ApiClient } from '@src/services/config';

/**
 * Corporate Cards member invites.
 *
 * Its own endpoint, not Settings → User Management's `user/sub-corporate`: a card member is an employee
 * identity with a card role, and the two paths no longer share an endpoint or a table.
 */
export interface CardMemberInvitePayload {
    name: string;
    email: string;
    mobileNo: string;
    role: string;
}

export const validateCardMember = async (payload: CardMemberInvitePayload) => {
    try {
        const res: SuccessGenericResponse<{ willUseExistingLogin?: boolean }> = await ApiClient.post(
            'user/card-members/validate',
            payload
        );
        return res?.data ?? false;
    } catch (error) {
        return false;
    }
};

export const createCardMember = async (payload: CardMemberInvitePayload) => {
    try {
        const res: SuccessGenericResponse<{ userId?: string; resent?: boolean }> =
            await ApiClient.post('user/card-members', {
                ...payload,
                baseUrl: FRONTEND_BASE_URL,
            });
        return res;
    } catch (error) {
        return false;
    }
};

/**
 * Reissues the set-password invite for a member who has not set one yet.
 *
 * Its own endpoint rather than Settings' `sub-corporate/resend`: a card member has no sub-corporate row, so
 * that one answers "user not found" for every one of them.
 */
export const resendCardMemberInvite = async (userId: number | string) => {
    try {
        const res: SuccessGenericResponse<{ resent: boolean }> = await ApiClient.post(
            `user/card-members/${userId}/resend`,
            { baseUrl: FRONTEND_BASE_URL }
        );
        return res;
    } catch (error) {
        return false;
    }
};

/**
 * Revokes this member's Corporate Cards access.
 *
 * Revokes the MEMBERSHIP, never the login — the same person may hold Payroll on the same identity, and
 * deleting them would take that with it.
 */
export const revokeCardMember = async (userId: number | string) => {
    try {
        const res: SuccessGenericResponse<Record<string, never>> = await ApiClient.delete(
            `user/card-members/${userId}`
        );
        return res;
    } catch (error) {
        return false;
    }
};

/**
 * Changes a member's editable details.
 *
 * Its own endpoint rather than Settings' `PUT sub-corporate/:id`: that one requires a services array on every
 * write and refused the whole form with "Select at least one service", because a card member holds services
 * through their employee identity and this screen never offers any.
 */
export interface CardMemberEdit {
    name?: string;
    mobileNo?: string;
    role?: string;
}

export const updateCardMember = async (userId: number | string, changes: CardMemberEdit) => {
    try {
        const res: SuccessGenericResponse<Record<string, never>> = await ApiClient.patch(
            `user/card-members/${userId}`,
            changes
        );
        return res;
    } catch (error) {
        return false;
    }
};
