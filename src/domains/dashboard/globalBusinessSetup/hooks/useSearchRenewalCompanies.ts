import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';

import { searchRenewalCompanies } from '../api/globalBusinessSetup';

export interface CompanyOption {
    value: string;
    label: string;
    country?: string;
    company_type?: string;
    freezone?: string;
}

const useSearchRenewalCompanies = (input: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const debounced = useDebounce(input, 300);
    const [options, setOptions] = useState<CompanyOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!debounced || debounced.length < 3) {
            setOptions([]);
            setIsLoading(false);
            return;
        }
        let cancelled = false;
        setIsLoading(true);
        searchRenewalCompanies({ userId: id, userType: role, search: debounced })
            .then(res => {
                if (cancelled) return;
                const companies = res?.companies ?? [];
                setOptions(
                    companies.map((c: any) => ({
                        value: c._id,
                        label: c.proposed_name,
                        country: c.country ?? '',
                        company_type: c.type ?? '',
                        freezone: c.freezone ?? '',
                    }))
                );
            })
            .catch(() => {
                if (!cancelled) setOptions([]);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        // eslint-disable-next-line consistent-return
        return () => {
            cancelled = true;
        };
    }, [debounced, id, role]);

    return { options, isLoading, debouncedQuery: debounced };
};

export default useSearchRenewalCompanies;
