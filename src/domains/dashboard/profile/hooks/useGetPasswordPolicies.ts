import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPasswordPolicies } from '../api/basicInfo';
import { PasswordPolicy } from '../types/index';

const useGetPasswordPolicies = () => {
  
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [respData, setRespData] = useState<PasswordPolicy>();

    const getData = useCallback(async () => {
        setIsLoading(true);

        const data = await getPasswordPolicies({ userId: id, userType: role });
   
        if (data) {
            setRespData(data.data[0]);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getData();
    }, [getData]);

    return {
        respData,
        isLoading,
    };
};

export default useGetPasswordPolicies;
