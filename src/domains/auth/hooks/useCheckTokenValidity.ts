import { useCallback, useEffect, useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';

import { checkTokenApi } from '../api/index';
import { TokenvalidityRequest } from '../types/index';

export default function useCheckTokenValidity(values: TokenvalidityRequest) {
    const [isLoading, setIsLoading] = useState(true);
    const [validtoken, setValidtoken] = useState(false);
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
        if (values.token && values.username) {
            getData(values.token, values.username);
        }
    }, [getData, values.token, values.username]);
    return { loader: isLoading, validtoken };
}
