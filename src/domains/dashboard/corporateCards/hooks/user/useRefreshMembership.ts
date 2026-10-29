import { useCallback, useState } from 'react';

import { loginSuccess, ServiceMembership } from '@src/domains/auth/slices/loginSlice';
import { useAppDispatch } from '@src/hooks/store';
import { updateRefreshToken } from '@src/services/refreshToken';
import { showToast } from '@src/slices/apiSlice';

interface RefreshedSession {
    token?: string;
    refreshToken?: string;
    sessionId?: string;
    employeeProfileId?: number | string | null;
    serviceMemberships?: ServiceMembership[] | null;
}

/**
 * Pulls a service granted since login into the live session.
 *
 * An approval writes the membership to the employee's row, but the gate on every card route reads the
 * session blob written at login — so until the session is rotated the employee is still a non-member to
 * the server, and the first call they make after being approved is refused. The rotation rebuilds that
 * blob from a fresh read, and this lands the same fields in Redux so the UI stops showing them the
 * request screens.
 */
export const useRefreshMembership = () => {
    const dispatch = useAppDispatch();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshMembership = useCallback(async (): Promise<boolean> => {
        setIsRefreshing(true);
        try {
            const response = await updateRefreshToken();
            const data = (response?.data?.data ?? {}) as RefreshedSession;
            if (!data.token) throw new Error('session not rotated');

            dispatch(
                loginSuccess({
                    token: data.token,
                    ...(data.refreshToken ? { refreshToken: data.refreshToken } : {}),
                    ...(data.sessionId ? { sessionId: data.sessionId } : {}),
                    ...(data.employeeProfileId !== undefined
                        ? { employeeProfileId: data.employeeProfileId }
                        : {}),
                    ...(data.serviceMemberships !== undefined
                        ? { serviceMemberships: data.serviceMemberships }
                        : {}),
                })
            );
            return true;
        } catch {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Could not refresh your access. Please sign in again.',
                })
            );
            return false;
        } finally {
            setIsRefreshing(false);
        }
    }, [dispatch]);

    return { refreshMembership, isRefreshing };
};
