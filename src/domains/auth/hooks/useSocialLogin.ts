import { useNavigate } from 'react-router-dom';

import { SuccessGenericResponse, UserRole } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { takeSsoEntry } from '@src/services/ssoEntry';
import { showToast } from '@src/slices/apiSlice';
import { hideLoader, showLoader } from '@src/slices/loaderSlice';

import useCompleteLogin from './useCompleteLogin';
import { oidcLogin } from '../api';
import { loginSuccess } from '../slices/loginSlice';
import { LoginResponse, SocialLoginPayload } from '../types';

export const isSocialProfileIncomplete = (data?: Partial<SocialLoginPayload> | null) =>
    data?.role !== UserRole.SYSTEM && (!data?.name || !data?.mobileNo || !data?.contactPersonName);

export default function useSocialLogin() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { completeLogin } = useCompleteLogin();
    const auth = useAppSelector(state => state.reducer.auth);

    const handleOidcLogin = (service = '') => oidcLogin(service);

    const rejectSocialLogin = (message?: string) => {
        dispatch(
            showToast({
                description: message || 'Something went wrong',
                variant: 'error',
            })
        );
        navigate(paths.auth.jwt.login, { replace: true });
        dispatch(hideLoader());
    };

    const redirectForService = (_service?: string | null) => ({});

    const establishSession = async (payload: SocialLoginPayload) => {
        const data: SocialLoginPayload = {
            ...payload,
            role: payload.role?.toLowerCase(),
        };
        if (data.maxPasswordAge) {
            navigate('/auth/ChangePassword', {
                state: {
                    userName: data?.username || '',
                    password: '',
                },
            });
            dispatch(hideLoader());
            return;
        }

        const autoLogin = takeSsoEntry();

        if (isSocialProfileIncomplete(data)) {
            dispatch(loginSuccess({ ...data, autoLogin, isAuthenticated: false, redirectUrl: '' }));
            dispatch(hideLoader());
            return;
        }

        await completeLogin(
            { ...data, autoLogin } as LoginResponse,
            redirectForService(data?.service)
        );
        dispatch(hideLoader());
    };

    const handlePostSocailLogin = (response: SuccessGenericResponse<SocialLoginPayload | null>) => {
        dispatch(showLoader());
        const data = response?.data;

        if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
            rejectSocialLogin(response?.message);
            return;
        }

        establishSession(data);
    };

    const finalizeSocialRegistration = async (updated?: Partial<SocialLoginPayload>) => {
        await completeLogin(
            { ...auth, ...updated } as LoginResponse,
            redirectForService(auth?.service)
        );
    };

    return {
        handlePostSocailLogin,
        finalizeSocialRegistration,
        handleOidcLogin,
    };
}
