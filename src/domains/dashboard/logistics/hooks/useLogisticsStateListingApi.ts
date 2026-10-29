import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { stateListing } from '../api/index';
import { IStateListingResponse, commonSelectType } from '../types/index';

export const useLogisticsStateListingApi = (searchText: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [stateList, setStateList] = useState<commonSelectType[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    const getStateList = useCallback(async () => {
        const data: IStateListingResponse | false = await stateListing({
            userId: id,
            userType: role,
            searchText,
        });
        if (data) {
            const listingData = data;
            const arr = listingData?.states?.map(item => ({
                oName: item.option ?? '',
                oValue: item.value ?? '',
            }));
            setStateList(arr);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [searchText, id, role]);
    useEffect(() => {
        getStateList();
    }, [getStateList]);
    return { stateList, isLoading };
};
