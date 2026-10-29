import React, { useEffect, useMemo, useRef } from 'react';

import { Flex, Spin } from 'antd';
import { useLocation } from 'react-router-dom';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import useSocialLogin, { isSocialProfileIncomplete } from '../../hooks/useSocialLogin';
import { SocialLoginPayload } from '../../types';
import SocialRegisterCompletionForm from '../sections/SocialRegisterCompletionForm';

const SocialLoginView = () => {
    const location = useLocation();
    const { handlePostSocailLogin } = useSocialLogin();
    const isHandled = useRef(false);

    const auth = useAppSelector(state => state.reducer.auth);
    const needsCompletion =
        !!auth?.token && !auth?.isAuthenticated && isSocialProfileIncomplete(auth);

    const query: SuccessGenericResponse<SocialLoginPayload | null> = useMemo(() => {
        const params = Object.fromEntries(new URLSearchParams(location.search).entries());

        let data: SocialLoginPayload | null = null;
        try {
            data = params.data ? JSON.parse(params.data) : null;
        } catch {
            data = null;
        }

        return {
            status: params?.status === 'true',
            message: params?.message || '',
            responseCode: params?.responseCode || '',
            data,
        };
    }, [location.search]);

    useEffect(() => {
        if (isHandled.current) return;
        isHandled.current = true;
        handlePostSocailLogin(query);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    if (needsCompletion) {
        return <SocialRegisterCompletionForm />;
    }

    return (
        <Flex align="center" justify="center" gap={10} className="w-full min-h-svh">
            <Spin />
        </Flex>
    );
};

export default SocialLoginView;
