import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getCorporates } from '../api/corporates';
import { AccountInfo, AccountInfoData } from '../types/corporates';

const useGetCorporateDatas = (searchText: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);
    const [corporateDatas, setCorporateDatas] = useState<AccountInfo[]>();
    const getData = useCallback(async () => {
        setLoading(true);
        const data: AccountInfoData | false = await getCorporates({
            userId: id,
            userType: role,
            searchText,
        });
        if (data) {
            setCorporateDatas(data.result);
        }
        setLoading(false);
    }, [id, role, searchText]);

    useEffect(() => {
        getData();
    }, [getData]);

    return { corporateDatas, loading };
};

export default useGetCorporateDatas;
