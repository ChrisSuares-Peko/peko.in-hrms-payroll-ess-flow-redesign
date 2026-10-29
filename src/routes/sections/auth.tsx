import { lazy } from 'react';

import { Outlet } from 'react-router-dom';

import SocialLogin from '@src/domains/auth/pages/SocialLogin';
import SsoRedirect from '@src/domains/auth/pages/SsoRedirect';
import GuestGuard from '@src/guard/GuestGuard';

import { paths } from '../paths';

const ForgotPassword = lazy(() => import('@domains/auth/components/views/ForgotPasswordView'));
const PassportExpiryResetViews = lazy(
    () => import('@domains/auth/components/views/PassportExpiryResetViews')
);
const ConsentView = lazy(() => import('@domains/auth/components/views/ConsentView'));

const LoginPage = lazy(() => import('@domains/auth/pages/Login'));
const SignupPage = lazy(() => import('@domains/auth/pages/Register'));

const ResetPasswordPage = lazy(() => import('@domains/auth/components/views/ResetPasswordView'));
const EmailVerification = lazy(() => import('@domains/auth/pages/EmailIdStatus'));
const PasswordUpdateSuccessPage = lazy(
    () => import('@domains/auth/components/views/PasswordUpdateSuccess')
);
const LoginCustomError = lazy(() => import('@domains/failed/pages/LoginCustomError'));

const auth = {
    path: '',
    element: (
        <GuestGuard>
            <Outlet />
        </GuestGuard>
    ),
    children: [
        {
            path: 'login',
            element: <LoginPage />,
        },
        {
            path: 'consent',
            element: <ConsentView />,
        },
        {
            path: 'register',
            element: <SignupPage />,
        },
        {
            path: 'forgotpassword',
            element: <ForgotPassword />,
        },
        {
            path: 'ChangePassword',
            element: <PassportExpiryResetViews />,
        },
    ],
};

export const authRoutes = [
    {
        path: 'auth',
        children: [auth],
    },
    {
        path: paths.auth.resetPassword,
        element: <ResetPasswordPage />,
    },
    {
        path: paths.auth.setPassword,
        element: <ResetPasswordPage />,
    },
    {
        path: paths.auth.passwordSuccess,
        element: <PasswordUpdateSuccessPage />,
    },
    {
        path: paths.auth.verifyEmail,
        element: <EmailVerification />,
    },
    {
        path: paths.auth.socialLogin,
        element: <SocialLogin />,
    },
    {
        path: paths.auth.socialError,
        element: <LoginCustomError />,
    },
    {
        path: paths.auth.ssoLogin,
        element: (
            <GuestGuard>
                <SsoRedirect />
            </GuestGuard>
        ),
    },
];
