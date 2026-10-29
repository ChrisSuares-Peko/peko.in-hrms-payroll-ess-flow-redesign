import { useEffect, useState, useRef } from 'react';

import { Flex, Skeleton } from 'antd';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { consentRequest, fetchConsent } from '../../api';
import ConsentCard from '../sections/ConsentCard';

type ConsentTokenPayload = {
    client_id?: string;
    redirect_uri?: string;
    state?: string;
    scope?: string;
    redirectURI?: string;
    [key: string]: any;
};

const ConsentView = () => {
    const dispatch = useAppDispatch();
    const { search } = useLocation();
    const navigate = useNavigate();
    const [decodedToken, setDecodedToken] = useState<(ConsentTokenPayload & JwtPayload) | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [btnLoading, setBtnLoading] = useState(false);
    const [isNewScopes, setIsNewScopes] = useState(true);

    // Prevent multiple auto-consent triggers
    const consentTriggered = useRef(false);

    const {
        redirectURI,
        id: userId,
        isAuthenticated,
    } = useAppSelector(states => states.reducer.auth);

    useEffect(() => {
        const checkConsent = async () => {
            const params = new URLSearchParams(search);
            const token = params.get('token');

            if (!token) {
                dispatch(showToast({ description: 'Token not found in URL', variant: 'error' }));
                setLoading(false);
                return;
            }

            try {
                const decoded = jwtDecode<ConsentTokenPayload & JwtPayload>(token);
                setDecodedToken(decoded);
                if (decoded?.redirectURI) {
                    window.location.href = decoded?.redirectURI;
                    return;
                }

                if (!isAuthenticated || !userId) {
                    dispatch(showToast({ description: 'User not found', variant: 'error' }));
                    setLoading(false);
                    return;
                }

                const consentDetails = await fetchConsent({
                    client_id: decoded.client_id || '',
                    user_id: String(userId),
                    scope: decoded.scope || '',
                });

                if (consentDetails?.consentRequired === false) {
                    setIsNewScopes(false);
                    if (!consentTriggered.current) {
                        consentTriggered.current = true;
                        await handleAllowConsent(decoded);
                    }
                } else {
                    setIsNewScopes(true);
                }
                setLoading(false);
            } catch (error) {
                dispatch(showToast({ description: 'Invalid token format', variant: 'error' }));
            }
        };
        checkConsent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, userId, isAuthenticated, redirectURI]);

    const handleAllowConsent = async (
        tokenData: ConsentTokenPayload & JwtPayload = decodedToken!
    ) => {
        setBtnLoading(true);

        if (!tokenData) {
            dispatch(showToast({ description: 'Missing token data', variant: 'error' }));
            setBtnLoading(false);
            return;
        }

        try {
            const params = new URLSearchParams(search);
            const token = params.get('token') || tokenData?.token;

            const data = await consentRequest({ token, user: { id: userId } });
            if (data?.redirectUrl) {
                window.location.href = data.redirectUrl;
            }
        } catch (error) {
            dispatch(showToast({ description: 'Consent request failed', variant: 'error' }));
        } finally {
            setBtnLoading(false);
        }
    };

    const handleDenyConsent = () => {
        const appName = decodedToken?.client_name || decodedToken?.client_id || 'the application';
        dispatch(
            showToast({
                description: `You denied access to ${appName}.`,
                variant: 'info',
            })
        );
        navigate(paths.auth.jwt.login);
    };

    if (loading || !isNewScopes) {
        return (
            <Flex justify="center" align="center" className="min-h-svh w-full bg-bgLightGray px-3">
                <div className="w-full sm:w-[26rem] bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                    <Skeleton active paragraph={{ rows: 8 }} />
                </div>
            </Flex>
        );
    }

    const { client_id: clientId, scope, client_name: clientName } = decodedToken || {};

    return (
        <Flex justify="center" align="center" className="min-h-svh w-full bg-bgLightGray px-3">
            <ConsentCard
                clientName={clientName}
                clientId={clientId}
                scope={scope}
                btnLoading={btnLoading}
                onAllow={() => handleAllowConsent()}
                onDeny={handleDenyConsent}
            />
        </Flex>
    );
};

export default ConsentView;
