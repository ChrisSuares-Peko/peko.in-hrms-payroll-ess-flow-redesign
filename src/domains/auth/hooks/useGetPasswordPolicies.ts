import { useCallback, useEffect, useState } from 'react';

import { getPasswordPolicies } from '../api/index';
import { PasswordPolicy } from '../types/index';

const useGetPasswordPolicies = (username: any) => {
    const [isLoading, setIsLoading] = useState(true);
    const [respData, setRespData] = useState<PasswordPolicy>();
    const getData = useCallback(async () => {
        setIsLoading(true);
        const data = await getPasswordPolicies(username);
        if (data) {
            setRespData(data.data);
        }
        setIsLoading(false);
    }, [username]);

    useEffect(() => {
        getData();
    }, [getData]);

    return {
        respData,
        isLoading,
    };
};

export default useGetPasswordPolicies;
