import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPasswordPolicies } from '../api/index';
import { PasswordPolicy } from '../types/index';

// PROTOTYPE-SETUP: the backend's default policy (backend-reference/users/controllers/admin/signUp.js:904),
// used when there is no session token so the set-password screen needs no network call.
const DEMO_DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
    id: 0,
    level: 1,
    minLength: 8,
    minPasswordAge: 0,
    maxPasswordAge: 100000000,
    minChangeChars: 3,
    prohibitPasswordReuse: true,
    prohibitPasswordReuseTimes: 2,
    maxInvalidLoginAttempts: 3,
    lockEffectivePeriod: 2,
    lockoutTimespan: 4,
    enableBannedPasswords: false,
    customBannedPasswords: '',
    preventPersonalDataInPassword: true,
};

const useGetPasswordPolicies = (username: any) => {
    const { token } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [respData, setRespData] = useState<PasswordPolicy>();
    const getData = useCallback(async () => {
        if (!token) {
            setRespData(DEMO_DEFAULT_PASSWORD_POLICY);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const data = await getPasswordPolicies(username);
        if (data) {
            setRespData(data.data);
        }
        setIsLoading(false);
    }, [username, token]);

    useEffect(() => {
        getData();
    }, [getData]);

    return {
        respData,
        isLoading,
    };
};

export default useGetPasswordPolicies;
