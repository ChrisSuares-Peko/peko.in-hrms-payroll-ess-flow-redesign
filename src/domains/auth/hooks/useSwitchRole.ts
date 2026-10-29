import { useState } from 'react';

import {
    EMPLOYEE_MODE_LANDING_ROUTE,
    holdsService,
} from '@src/domains/dashboard/corporateCards/utils/activeRole';
import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { persistor } from '@src/store/store';

import { switchRole as switchRoleApi, SwitchableRole } from '../api/index';
import { loginSuccess, ServiceMembership } from '../slices/loginSlice';

/**
 * Switches the session into another identity owned by the same credential (corporate <-> employee), without
 * re-entering a password.
 *
 * Finishes with a full page load rather than an in-app navigation. Almost everything already fetched belongs
 * to the identity being left behind — the services tree, the entitlements, the profile, the card KYC and KYB
 * stage — and it is all held in slices that are NOT persisted, so a load rebuilds them and an in-app
 * navigation does not. Switching used to navigate, and `useUserInfo` refetches only when it finds `null`, so
 * the previous identity's sidebar simply stayed on screen. Clearing each slice by hand works only until the
 * next identity-scoped slice is added and nobody remembers this list.
 *
 * `auth` IS persisted, so the new session survives the load — flushed first, because redux-persist writes on
 * a throttle and reloading before it lands would drop the session that was just minted.
 */
export default function useSwitchRole() {
    const dispatch = useAppDispatch();
    const [isSwitching, setIsSwitching] = useState(false);

    const destinationFor = (role: SwitchableRole, response: unknown) => {
        // A sub-corporate acts inside the corporate shell — its session role IS corporate, narrowed to the
        // services that member was granted — so it lands where a corporate session lands.
        if (role === 'corporate' || role === 'sub_corporate') return paths.dashboard.home;
        // An employee holding Corporate Cards belongs in the corporate shell — the only one that fetches the
        // services tree, so the ESS portal would leave them with a sidebar that knows nothing about cards.
        const { serviceMemberships } = (response ?? {}) as {
            serviceMemberships?: ServiceMembership[] | null;
        };
        return holdsService(serviceMemberships) ? EMPLOYEE_MODE_LANDING_ROUTE : paths.employee.home;
    };

    const switchRole = async (role: SwitchableRole) => {
        setIsSwitching(true);
        const response = await switchRoleApi(role);
        if (!response) {
            setIsSwitching(false);
            return false;
        }

        // `loginSuccess` merges, and `auth` survives the reload — so the identity being left behind has to be
        // cleared field by field, or the route guards read the previous identity's authority.
        const clearedIdentity =
            role === 'user'
                ? { subCorporateId: null, subCorporateRole: null, subCorporateUsername: undefined }
                : {
                      employeeProfileId: null,
                      employeeName: null,
                      employeeEmail: null,
                      employeeMobile: null,
                      serviceMemberships: null,
                  };

        dispatch(
            loginSuccess({
                ...clearedIdentity,
                ...response,
                isAuthenticated: true,
            })
        );

        try {
            await persistor.flush();
        } catch {
            // The reload below is what makes the switch take effect; a flush that fails is not worth
            // stranding the caller on the previous identity for.
        }

        window.location.replace(destinationFor(role, response));
        return true;
    };

    return { switchRole, isSwitching };
}
