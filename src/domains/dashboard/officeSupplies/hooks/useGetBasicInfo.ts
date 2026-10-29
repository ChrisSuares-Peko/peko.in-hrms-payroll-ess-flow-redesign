import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { BasicInfoResponse } from '../../profile/types';
import { getBasicInfo } from '../api/basicInfo';

export default function useBasicInfoApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<BasicInfoResponse>();

    const getUserBasicInfo = useCallback(async () => {
        const resp: BasicInfoResponse | false = await getBasicInfo({
            userId: id,
            userType: role,
        });
        if (resp) {
            setData(resp);
        }
    }, [id, role]);

    useEffect(() => {
        getUserBasicInfo();
    }, [getUserBasicInfo]);

    return {
        data,
    };
}
