import { useCallback, useEffect, useState } from 'react';

import { DropDown } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getCountries } from '../api/globalBusinessSetup';
import { CompanyType, Country, Freezone } from '../types/globalBusinessSetup';

export const useCountries = (countryId: string, companyTypeId: string, filters?: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [countriesAndDetails, setCountriesAndDetails] = useState<Country[]>([]);
    const [countryOptions, setCountryOptions] = useState<
        { value: string; label: string; icon: string }[]
    >([]);
    const [companyOptions, setCompanyOptions] = useState<DropDown>([]);
    const [freezoneOptions, setFreezoneOptions] = useState<DropDown>([]);
    const [countriesLoading, setCountriesLoading] = useState<boolean>(true);
    const [companyLoading, setCompanyLoading] = useState<boolean>(false);
    const [freezoneLoading, setFreezoneLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCountries = useCallback(async () => {
        setCountriesLoading(true);
        const res: { countries: Country[] } | false = await getCountries({
            userId: id,
            userType: role,
            filters,
        });

        if (res) {
            // Defence-in-depth: BE filter restricts to active countries, but
            // keep a strict `is_active === true` client-side guard so any
            // mis-filtered API response can never surface an inactive entry.
            // Vendor returns countries pre-sorted by apps_count (desc); preserve
            // that order — no client-side re-sort.
            const activeCountries = res.countries.filter(c => c.is_active === true);

            setCountriesAndDetails(activeCountries);

            const countries = activeCountries.map((country: Country) => ({
                value: country._id,
                label: country.name,
                icon: country.logo,
            }));
            setCountryOptions(countries || []);
            setError(null);
        }
        setCountriesLoading(false);
    }, [filters, id, role]);

    const fetchCompanyOptions = useCallback(async () => {
        setCompanyLoading(true);
        const companies = countriesAndDetails
            .find((country: Country) => country._id === countryId)
            ?.company_types.filter((company: CompanyType) => company.is_active === true)
            .map((company: CompanyType) => ({
                value: company.key,
                label: company.label === 'Freezone' ? 'Free Zone' : company.label,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

        setCompanyOptions(companies || []);
        setCompanyLoading(false);
    }, [countriesAndDetails, countryId]);

    const fetchFreezoneOptions = useCallback(async () => {
        setFreezoneLoading(true);
        const company = countriesAndDetails
            .find((country: Country) => country._id === countryId)
            ?.company_types.find((companyType: CompanyType) => companyType.key === companyTypeId);
        const freezones = company?.freezones
            ?.filter((freezone: Freezone) => freezone.is_active === true)
            .map((freezone: Freezone) => ({
                value: freezone.key,
                label: freezone.label,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

        setFreezoneOptions(freezones || []);
        setFreezoneLoading(false);
    }, [countriesAndDetails, countryId, companyTypeId]);

    useEffect(() => {
        fetchCountries();
    }, [fetchCountries, id, role]);

    useEffect(() => {
        fetchCompanyOptions();
    }, [fetchCompanyOptions, countryId]);

    useEffect(() => {
        fetchFreezoneOptions();
    }, [fetchFreezoneOptions, countryId, companyTypeId]);

    return {
        countriesAndDetails,
        countryOptions,
        companyOptions,
        freezoneOptions,
        countriesLoading,
        companyLoading,
        freezoneLoading,
        error,
    };
};
