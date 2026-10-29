import { signInWithCustomToken } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import { UserRole } from '@customtypes/general';
import {
    EMPLOYEE_MODE_LANDING_ROUTE,
    holdsService,
} from '@src/domains/dashboard/corporateCards/utils/activeRole';
import { auth } from '@src/domains/dashboard/pekoConnect/config/firebaseConfig';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { takePendingIdpToken } from '@src/services/idpPendingRequest';
import { TAB_ID } from '@src/utils/tabId';

import { loginSuccess, ServiceMembership } from '../slices/loginSlice';
import { LoginResponse } from '../types';

type CompleteLoginOptions = {
    redirectTo?: string;
    state?: unknown;
};

export default function useCompleteLogin() {
    const redirectURL = useAppSelector(state => state.reducer.auth.redirectUrl);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const authChannel = new BroadcastChannel('authChannel');

    const completeLogin = async (response: LoginResponse, options: CompleteLoginOptions = {}) => {
        if (response.firebaseToken) {
            try {
                await signInWithCustomToken(auth, response.firebaseToken);
            } catch (firebaseError: any) {
                console.error('Firebase authentication error:', firebaseError?.message);
            }
        }

        dispatch(
            loginSuccess({
                ...response,
                isAuthenticated: true,
                redirectUrl: redirectURL,
            })
        );

        authChannel.postMessage({ type: 'login', tabId: TAB_ID });

        const pendingIdpToken = takePendingIdpToken();
        if (pendingIdpToken) {
            navigate(`${paths.auth.jwt.consent}?token=${pendingIdpToken}`, { replace: true });
        } else if (response.role === UserRole.SYSTEM) {
            // Explicit post-login redirect — don't rely solely on GuestGuard.
            navigate(paths.systemUser.dashboard, { replace: true });
        } else if (response.role === UserRole.EMPLOYEE) {
            const { serviceMemberships } = response as {
                serviceMemberships?: ServiceMembership[] | null;
            };
            navigate(
                holdsService(serviceMemberships)
                    ? EMPLOYEE_MODE_LANDING_ROUTE
                    : paths.employee.home,
                { replace: true }
            );
        } else {
            const fallback =
                redirectURL && redirectURL !== '/' ? redirectURL : paths.dashboard.home;
            navigate(options.redirectTo || fallback, {
                replace: true,
                state: options.state,
            });
        }
        // PROTOTYPE-SETUP: MoEngage analytics call removed (SDK stripped).
    };

    return { completeLogin };
}
