import { useCallback, useEffect, useState } from 'react';

import { getCorporates } from '../api/index';

type GetCorporates = {
    searchText: string;
};

export function useGetCorporates({ searchText }: GetCorporates) {
    const [corporates, setCorporates] = useState<any | null>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (searchText && searchText.length >= 3) {
            setIsLoading(true);
            try {
                const data = await getCorporates({ searchText });
                const options =
                    data?.result?.map((it: any) => ({
                        value: it?.id,
                        label: `${it?.name} - ${it?.credential?.username}`,
                    })) || [];
                setCorporates(options);
            } catch (error) {
                console.error('Error fetching corporates:', error);
                setCorporates([]);
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
            setCorporates([]);
        }
    }, [searchText]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { corporates, isLoading, refresh: fetchData };
}
