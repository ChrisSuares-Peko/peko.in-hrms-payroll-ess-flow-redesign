import { useCallback, useEffect, useState } from 'react';

import { UserRole } from '@customtypes/general';
import { loginSuccess } from '@src/domains/auth/slices/loginSlice';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { persistor } from '@src/store/store';

import { getSwitchRoleState, switchActiveRole } from '../../api/user/activeRoleApi';
import { ADMIN_ROLE, EMPLOYEE_ROLE, membershipFor } from '../../utils/activeRole';

/**
 * The Admin/Employee mode an employee acts in, within Corporate Cards.
 *
 * NOT `useSwitchRole` (domains/auth) — that switches which IDENTITY a person signs in as, corporate vs
 * employee, and calls `POST user/switch-role`. This switches which authority MODE one identity acts in, and
 * calls `POST user/active-role`. Both were once named useSwitchRole, and importing them into the same module
 * was a duplicate-identifier error that silently resolved usages to the wrong hook.
 *
 * `modes` is empty unless the caller actually has a second mode, so the header renders nothing rather than a
 * one-option control. Only an employee whose ASSIGNED card role is Admin does: the account holder has a second
 * identity for this, not a mode.
 *
 * A switch changes real authority on the server, so the page is reloaded afterwards — every screen already
 * mounted was rendered for the previous mode, and re-fetching them piecemeal would leave the app in a mix.
 */
export const useActiveRole = () => {
    const { role, activeSubRole, serviceMemberships } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const assignedRole = membershipFor(serviceMemberships)?.role ?? null;
    /**
     * Decided locally first, from what login already told us.
     *
     * This used to come only from the server, and the fetch is swallowed on failure — so ANY hiccup left
     * `modes` empty and the switcher silently vanished for someone who genuinely is an Admin. That is not
     * hypothetical: `/api/v1/user` is rate-limited to 25 requests per 15 minutes at the gateway and this
     * fires on every header mount.
     *
     * Safe to decide here because it is not an authority decision — it only chooses whether to OFFER the
     * menu. The server clamps the active mode and refuses an unauthorised switch with a 403, so the worst a
     * wrong guess can do is show an option that is then declined.
     */
    const canSwitchLocally =
        role === UserRole.EMPLOYEE && assignedRole?.trim() === ADMIN_ROLE;

    const [modes, setModes] = useState<string[]>(
        canSwitchLocally ? [ADMIN_ROLE, EMPLOYEE_ROLE] : []
    );
    const [isSwitching, setIsSwitching] = useState(false);

    useEffect(() => {
        setModes(canSwitchLocally ? [ADMIN_ROLE, EMPLOYEE_ROLE] : []);
    }, [canSwitchLocally]);

    useEffect(() => {
        if (role !== UserRole.EMPLOYEE) return undefined;

        let cancelled = false;
        getSwitchRoleState().then(res => {
            if (cancelled || !res || !res.data) return;
            setModes(res.data.modes ?? []);
            // The SERVER's mode is the real one — it is what every card route is answered under. Trusting the
            // persisted slice instead left the menu showing "Admin (current)" while the session was actually
            // in Employee mode, so the Admin item rendered disabled and there was no way back.
            dispatch(loginSuccess({ activeSubRole: res.data.activeRole ?? null }));
        });
        return () => {
            cancelled = true;
        };
    }, [role, dispatch]);

    const changeRole = useCallback(
        async (nextRole: string) => {
            setIsSwitching(true);
            const res = await switchActiveRole(nextRole);
            if (!res) {
                setIsSwitching(false);
                return false;
            }
            dispatch(loginSuccess({ activeSubRole: res.data.activeRole }));
            // `auth` is persisted on a throttle, and the reload below reads it back. Without the flush the
            // dispatch above is lost and the app comes back believing it is still in the previous mode.
            try {
                await persistor.flush();
            } catch {
                // The reload is what applies the switch; a failed flush is corrected by the mount fetch above.
            }
            window.location.reload();
            return true;
        },
        [dispatch]
    );

    return {
        modes,
        assignedRole,
        activeRole: activeSubRole ?? assignedRole ?? null,
        canSwitch: modes.length > 1,
        isSwitching,
        changeRole,
    };
};
