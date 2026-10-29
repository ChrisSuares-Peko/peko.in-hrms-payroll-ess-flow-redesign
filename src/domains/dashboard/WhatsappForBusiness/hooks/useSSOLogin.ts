import { useState, useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { ssoLoginApi } from '../api/index';
import { SsoResponse } from '../types/index';

export default function useSsoLogin() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const handleSsoLogin = useCallback(async () => {
        setIsLoading(true);
        const payload = {
            userType: role,
            userId: id,
        };
        const resp: SsoResponse | false = await ssoLoginApi(payload);
        if (resp) {
            document.cookie = `aisensySSOToken=${encodeURIComponent(resp.token)}; expires=7; path=/; domain=.peko.one`;
            window.location.href = resp.redirectLink;
        }
        setIsLoading(false);
    }, [role, id]);

    return { handleSsoLogin, isLoading };
}
