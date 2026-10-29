import React, { useEffect, useRef } from 'react';

import { Flex, Spin } from 'antd';
import { useLocation } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { markSsoEntry } from '@src/services/ssoEntry';

import { oidcLogin } from '../api';

const SsoRedirect = () => {
    const { search } = useLocation();
    const { isAuthenticated } = useAppSelector(state => state.reducer.auth);
    const hasRedirected = useRef(false);

    useEffect(() => {
        if (isAuthenticated || hasRedirected.current) return;
        hasRedirected.current = true;
        markSsoEntry();
        oidcLogin(new URLSearchParams(search).get('service') || '');
    }, [isAuthenticated, search]);

    return (
        <Flex align="center" justify="center" gap={10} className="w-full min-h-svh">
            <Spin />
        </Flex>
    );
};

export default SsoRedirect;
