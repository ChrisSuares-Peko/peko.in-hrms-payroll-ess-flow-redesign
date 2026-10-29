import { useCallback, useEffect, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { checkTokenApi } from '../api/index';
import { TokenvalidityRequest } from '../types/index';

export default function useCheckTokenValidity(values: TokenvalidityRequest) {
    // PROTOTYPE-SETUP: with no session token (the prototype) there is no backend to validate the invite
    // link, so seed the result: valid by default, "link expired" with ?demo=expired.
    const { token: sessionToken } = useAppSelector(state => state.reducer.auth);
    const [searchParams] = useSearchParams();
    const demoTokenCheck = !sessionToken;
    const demoExpired = searchParams.get('demo') === 'expired';

    const [isLoading, setIsLoading] = useState(!demoTokenCheck);
    const [validtoken, setValidtoken] = useState(demoTokenCheck && !demoExpired);
    const getData = useCallback(async (token: string, username: string) => {
        const data: SuccessGenericResponse<any> | false = await checkTokenApi({
            token,
            username,
        });
        if (data) {
            setValidtoken(data?.data.validToken);
        }
        setIsLoading(false);
    }, []);
    useEffect(() => {
        if (demoTokenCheck) {
            setValidtoken(!demoExpired);
            setIsLoading(false);
            return;
        }
        if (values.token && values.username) {
            getData(values.token, values.username);
        }
    }, [getData, values.token, values.username, demoTokenCheck, demoExpired]);
    return { loader: isLoading, validtoken };
}
