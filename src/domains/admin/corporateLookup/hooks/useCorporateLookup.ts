import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getCorporateDropdownOptions, getCorporateLookupDetails } from '../../users/api';

export const useCorporateLookup = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [fetchingOptions, setFetchingOptions] = useState(false);
    const [data, setData] = useState<any>(null);
    const [options, setOptions] = useState<{ label: string; value: string; partnerName: string | null }[]>([]);

    const fetchDropdownOptions = useCallback(
        async (search: string) => {
            setFetchingOptions(true);
            const responseData: any = await getCorporateDropdownOptions({
                userId: id,
                userType: role,
                searchText: search,
            });

            if (responseData && responseData.result) {
                const fetchedOptions = responseData.result.map((item: any) => ({
                    label: item.name ? `${item.name} - ${item.username}` : item.username,
                    value: item.username,
                    partnerName: item.partnerName || null,
                }));
                setOptions(fetchedOptions);
            } else {
                setOptions([]);
            }
            setFetchingOptions(false);
        },
        [id, role]
    );

    const onSearchDropdown = useCallback(
        (val: string) => {
            fetchDropdownOptions(val);
        },
        [fetchDropdownOptions]
    );

    const searchCorporate = useCallback(
        async (searchText: string) => {
            if (!searchText) {
                dispatch(
                    showToast({
                        description: 'Please enter account ID or email',
                        variant: 'error',
                    })
                );
                return;
            }

            setIsLoading(true);
            const responseData: any = await getCorporateLookupDetails({
                userId: id,
                userType: role,
                searchText,
            });

            if (responseData) {
                setData(responseData);
            } else {
                setData(null);
            }
            setIsLoading(false);
        },
        [id, role, dispatch]
    );

    return {
        isLoading,
        fetchingOptions,
        data,
        options,
        onSearchDropdown,
        searchCorporate,
    };
};
