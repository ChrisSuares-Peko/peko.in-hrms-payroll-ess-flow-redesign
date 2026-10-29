import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

/**
 * The Admin/Employee MODE an employee acts in, within Corporate Cards.
 *
 * NOT `user/switch-role`: that path is the corporate <-> employee IDENTITY switch in the users service
 * (login.js), which is mounted earlier and would answer this POST instead — with "You do not have access to
 * this identity", because it expects role 'corporate' | 'user'.
 *
 * The users service is proxied at `/api/v1/user` and takes NO :userType/:userId segments: the controller reads
 * the caller from `req.user` and the `sessionid` header.
 */
const BASE = 'user/active-role';

export interface SwitchRoleState {
    /** The employee's assigned card role; null when they have no choice to make. */
    assignedRole: string | null;
    /** The mode they are currently acting in. */
    activeRole: string | null;
    /** Modes this session may switch between — empty when there is no choice to offer. */
    modes: string[];
}

export const getSwitchRoleState = async () => {
    try {
        const res: SuccessGenericResponse<SwitchRoleState> = await ApiClient.get(BASE);
        return res;
    } catch {
        return false;
    }
};

export const switchActiveRole = async (role: string) => {
    try {
        const res: SuccessGenericResponse<{ assignedRole: string; activeRole: string }> =
            await ApiClient.post(BASE, { role });
        return res;
    } catch {
        return false;
    }
};
