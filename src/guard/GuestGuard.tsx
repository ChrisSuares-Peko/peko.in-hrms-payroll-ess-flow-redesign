import { useCallback, useEffect } from 'react';

import { jwtDecode, JwtPayload } from 'jwt-decode';
import { useLocation, useNavigate } from 'react-router-dom';

import { loginSuccess } from '@src/domains/auth/slices/loginSlice';
import { LoginResponse } from '@src/domains/auth/types';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { useRootPath } from '@src/hooks/useRootPath';
import { paths } from '@src/routes/paths';
import { clearPendingIdpToken, savePendingIdpToken } from '@src/services/idpPendingRequest';

type GuestGuardProps = {
    children: React.ReactNode;
};

const JWT_STANDARD_CLAIMS = ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'];

export default function GuestGuard({ children }: GuestGuardProps) {
    const navigate = useNavigate();
    const { search, pathname } = useLocation();
    const rootPath = useRootPath();
    const { isAuthenticated, ...user } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const params = new URLSearchParams(search);
    const token = params.get('token');
    const check = useCallback(() => {
        if (isAuthenticated) {
            if (!token) {
                navigate(rootPath, { replace: true });
            } else if (!pathname.includes(paths.auth.jwt.consent)) {
                clearPendingIdpToken();
                navigate(`${paths.auth.jwt.consent}?token=${token}`, {
                    state: {
                        user,
                    },
                });
            }
        } else if (token) {
            const currentDateAndTime = new Date().getTime() / 1000;
            const decoded = jwtDecode<
                ((LoginResponse & { redirectURI?: string }) | any) & JwtPayload
            >(token);
            const decodedToken: Record<string, any> = Object.fromEntries(
                Object.entries(decoded).filter(([claim]) => !JWT_STANDARD_CLAIMS.includes(claim))
            );

            if (
                decodedToken &&
                decodedToken?.redirectURI &&
                decoded.exp! > currentDateAndTime &&
                decodedToken?.sessionId
            ) {
                dispatch(
                    loginSuccess({
                        ...decodedToken,
                        isAuthenticated: true,
                    })
                );
                window.location.href = decodedToken.redirectURI;
            } else {
                savePendingIdpToken(token);
            }
        }
    }, [dispatch, isAuthenticated, navigate, pathname, rootPath, token, user]);

    useEffect(() => {
        check();
    }, [check]);

    return <>{children}</>;
}
