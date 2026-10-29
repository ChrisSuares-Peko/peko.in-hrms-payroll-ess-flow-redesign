import { useEffect, useState } from 'react';

import { DropDown } from '@customtypes/general';

import { getCountries } from '../api/index';
import { CountriesResponse } from '../types/types';

export default function useGeneralApi() {
    const [countriesList, setCountriesList] = useState<DropDown>();
    const getCountriesList = async () => {
        const data: CountriesResponse | false = await getCountries();
        if (data) {
            setCountriesList(data.countries);
        }
    };
    useEffect(() => {
        getCountriesList();
    }, []);

    return { countriesList };
}
