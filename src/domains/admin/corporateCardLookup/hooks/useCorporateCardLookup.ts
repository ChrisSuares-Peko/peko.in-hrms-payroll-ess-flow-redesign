import { useCallback, useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getCorporateCardApplications } from '../../manage/api/corporateCardApplications';
import { getCorporateCardLookup } from '../api';
import { CorporateCardLookupDetail } from '../types';

export interface CorporateCardOption {
    label: string;
    value: number;
    accountId: string | null;
}

// Only corporates that applied for Corporate Cards have anything to look up, so the picker searches the
// applications list (company name, contact person or Peko account number).
const OPTIONS_PAGE_SIZE = 20;

export const useCorporateCardLookup = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [fetchingOptions, setFetchingOptions] = useState(false);
    const [data, setData] = useState<CorporateCardLookupDetail | null>(null);
    const [options, setOptions] = useState<CorporateCardOption[]>([]);
    // Typing fires a search per keystroke; only the newest response may land.
    const latestSearch = useRef(0);

    const onSearchDropdown = useCallback(
        async (searchText: string) => {
            latestSearch.current += 1;
            const requestId = latestSearch.current;
            setFetchingOptions(true);
            const response = await getCorporateCardApplications({
                userId: id,
                userType: role,
                searchText,
                page: 1,
                itemsPerPage: OPTIONS_PAGE_SIZE,
            });
            if (requestId !== latestSearch.current) return;
            setOptions(
                response
                    ? response.data.map(row => ({
                          label: row.companyName || row.fullName || `Corporate #${row.corporateId}`,
                          value: row.corporateId,
                          accountId: row.pekoAccountNumber,
                      }))
                    : []
            );
            setFetchingOptions(false);
        },
        [id, role]
    );

    const searchCorporate = useCallback(
        async (corporateId: number) => {
            setIsLoading(true);
            const response = await getCorporateCardLookup(role, id, corporateId);
            setIsLoading(false);
            if (!response) {
                setData(null);
                dispatch(
                    showToast({
                        variant: 'error',
                        description: 'Could not load this corporate. Please try again.',
                    })
                );
                return;
            }
            setData(response);
        },
        [id, role, dispatch]
    );

    const clear = useCallback(() => setData(null), []);

    return { isLoading, fetchingOptions, data, options, onSearchDropdown, searchCorporate, clear };
};
