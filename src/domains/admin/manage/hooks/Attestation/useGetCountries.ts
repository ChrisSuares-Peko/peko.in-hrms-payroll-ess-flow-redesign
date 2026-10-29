import { useCallback, useEffect, useState } from 'react';

import { getCountriesAPI } from '../../api/attestationCategory';

export function useGetCountries() {
    const [countryData, setCountryData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleGetCountries = useCallback(async () => {
        const data: any | false = await getCountriesAPI();

        if (data) {
            setCountryData(data?.data);
            setIsLoading(false);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        handleGetCountries();
    }, [handleGetCountries]);
    return { isLoading, countryData };
}
