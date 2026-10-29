import { useEffect, useState } from 'react';

import { DropDown } from '@customtypes/general';

import { getCountries } from '../../api/employeeApi/index';
import { CountriesResponse } from '../../types/types';

export default function useGeneralApi() {
    const [countriesList, setCountriesList] = useState<DropDown>();
    const [searchQuery, setSearchQuery] = useState<string>();
    const getCountriesList = async (query?: string) => {
        const data: CountriesResponse | false = await getCountries(query);
        if (data) {
            // India-first, since this is the India product — keep the rest alphabetical.
            const indiaIndex = data.countries.findIndex(c => c.label === 'India');
            const countries =
                indiaIndex > 0
                    ? [
                          data.countries[indiaIndex],
                          ...data.countries.slice(0, indiaIndex),
                          ...data.countries.slice(indiaIndex + 1),
                      ]
                    : data.countries;
            setCountriesList(countries);
        }
    };
    useEffect(() => {
        getCountriesList(searchQuery);
    }, [searchQuery]);

    return { countriesList, setSearchQuery };
}
