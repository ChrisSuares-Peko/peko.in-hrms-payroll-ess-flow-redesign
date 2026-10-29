import { useEffect, useState } from 'react';

import { DropDown } from '@customtypes/general';

import { getCountries } from '../../../profile/api/general';
import { CountriesResponse } from '../../types/ownerDoc/index';

export default function useGeneralApi() {
    const [countriesList, setCountriesList] = useState<DropDown>([]);
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
