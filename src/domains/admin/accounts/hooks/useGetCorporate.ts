import { useCallback, useEffect, useState } from 'react';

import { commonSelectType } from '@customtypes/general';
import { defaultSelectType } from '@src/domains/dashboard/logistics/types';
import { useAppSelector } from '@src/hooks/store';

import { CorporateUser } from '../../settings/types/disabledTypes';
import { getAllCorporates } from '../api/walletReport';
import { CorporateListResponse } from '../types/WalletReportTypes';

export default function useGetCorporate(searchText?: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [response, setResponse] = useState<CorporateUser[]>();
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
            setResponse(result);
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

    const getCorporateDetailsById = useCallback(
        (corporateId: string) => {
            if (!response) return undefined;

            const corporate = response.find(item => item.credentialId.toString() === corporateId);
            return corporate
                ? {
                      balance: corporate.balance,
                      credentialId: corporate.credentialId,
                      id: corporate.id,
                      username: corporate.username,
                      name: corporate.name,
                      city: corporate.city,
                      mobileNo: corporate.mobileNo,
                      registeredByName: corporate.registeredByName || 'N/A',
                  }
                : undefined;
        },
        [response]
    );

    useEffect(() => {
        getCorporateList();
    }, [getCorporateList]);

    return {
        isLoading,
        corporateList,
        setCorporatesList,
        corporatesList,
        getCorporateDetailsById,
        getCorporateList,
        initialVal,
    };
}
