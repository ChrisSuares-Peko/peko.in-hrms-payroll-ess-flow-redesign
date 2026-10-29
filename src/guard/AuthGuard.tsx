import { useCallback, useEffect, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { UserRole } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { setRedirectUrl } from '../domains/auth/slices/loginSlice';

type AuthGuardProps = {
    children: React.ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const dispatch = useAppDispatch();
    const { isAuthenticated, role } = useAppSelector(state => state.reducer.auth);
    const { services } = useAppSelector(state => state.reducer.services);
    const [checked, setChecked] = useState(false);

    // First service the system user actually has access to — used to land them on a
    // valid page when their role has no Dashboard access (otherwise RoleGuard would
    // show "Access Denied" on the hardcoded /system-user/dashboard landing route).
    const firstRoute = services?.data?.find(obj => obj.hasAccess === true);

    const check = useCallback(() => {
        if (!isAuthenticated) {
            dispatch(setRedirectUrl(pathname));
            const href = paths.auth.jwt.login;
            navigate(href, { replace: true });
        } else {
            if (
                firstRoute &&
                firstRoute.serviceCategory !== 'Dashboard' &&
                pathname.includes('dashboard') &&
                role === UserRole.SYSTEM
            ) {
                const path = `${paths.systemUser.index}/${firstRoute.serviceCategory
                    .toLowerCase()
                    .replace(/\s+/g, '-')}`;
                navigate(path, { replace: true });
                return;
            }
            setChecked(true);
        }
    }, [isAuthenticated, dispatch, pathname, navigate, firstRoute, role]);

    useEffect(() => {
        check();
    }, [check]);

    if (!checked) {
        return null;
    }

    return <>{children}</>;
}
