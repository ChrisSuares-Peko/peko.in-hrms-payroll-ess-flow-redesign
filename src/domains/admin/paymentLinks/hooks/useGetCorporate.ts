import { useCallback, useEffect, useState } from 'react';

import { commonSelectType } from '@customtypes/general';
import { defaultSelectType } from '@src/domains/dashboard/logistics/types';
import { useAppSelector } from '@src/hooks/store';

import { getAllCorporates } from '../api/dropdowns';
import { CorporateListResponse } from '../types/common';

export default function useGetCorporate(searchText?: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [corporateList, setCorporateList] = useState<defaultSelectType[]>([
        { label: '', value: '' },
    ]);
    const [corporatesList, setCorporatesList] = useState<commonSelectType[]>([
        { oName: '', oValue: '' },
    ]);
    const [initialVal, setInitialVal] = useState<commonSelectType[]>([{ oName: '', oValue: '' }]);

    const [isLoading, setIsLoading] = useState(false);

    const getCorporateList = useCallback(async () => {
        setIsLoading(true);
        const data: CorporateListResponse | false = await getAllCorporates({
            userId: id,
            userType: role,
            searchText: searchText || '',
        });
        setIsLoading(false);
        if (data) {
            const { result } = data;
            const arr = result.map(corporate => ({
                label: `${corporate.name} - ${corporate.username}`,
                value: corporate.credentialId.toString(),
            }));

            const arr2 = result.map(corporate => ({
                oName: `${corporate.name} - ${corporate.username}`,
                oValue: corporate.credentialId.toString(),
            }));

            setCorporatesList(arr2);
            setInitialVal(arr2);

            setCorporateList(arr);
        }
    }, [id, role, searchText]);

    useEffect(() => {
        getCorporateList();
    }, [getCorporateList]);

    return {
        isLoading,
        corporateList,
        setCorporatesList,
        corporatesList,
        getCorporateList,
        initialVal,
    };
}
