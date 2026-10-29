import { useCallback, useEffect, useState } from 'react';

import { getCountriesAPI, getCountriesPhoneCodeAPI } from '../api';
import { CountryCode, PhoneCode } from '../types/airlineTypes';
import { CountryList, PhoneCodeList } from '../types/apiPayloadTypes';

export default function useGetCountries() {
    const [isLoading, setIsLoading] = useState(true);
    const [countryData, setCountryData] = useState<CountryCode[]>([]);
    const [phoneCodes, setPhoneCodes] = useState<PhoneCode[]>([]);

    const HandleGetCountries = useCallback(async () => {
        const data: CountryList | false = await getCountriesAPI();
        if (data) {
            setCountryData(data?.countryCodes);
            setIsLoading(false);
        }
        setIsLoading(false);
    }, []);

    const HandleGetCountriesPhoneCode = useCallback(async () => {
        const data: PhoneCodeList | false = await getCountriesPhoneCodeAPI();
        if (data) {
            setPhoneCodes(data.phoneCodes);
            setIsLoading(false);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        HandleGetCountries();
        HandleGetCountriesPhoneCode();
    }, [HandleGetCountries, HandleGetCountriesPhoneCode]);

    return { countryData, phoneCodes, isLoading };
}
