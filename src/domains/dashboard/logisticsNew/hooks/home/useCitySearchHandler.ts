import { useEffect } from 'react';

import { useSelector } from 'react-redux';

import { RootState } from '@store/store';

interface Props {
    debouncedOrginSearchKey: string;
    debouncedDestinationSearchKey: string;
    getOrginCity: (key: string) => void;
    getDestinationCity: (key: string) => void;
    orginCityData: any[];
    destinationCityData: any[];
    setOrginCityData: (data: any[]) => void;
    setDestinationCityData: (data: any[]) => void;
}

export const useCitySearchHandler = ({
    debouncedOrginSearchKey,
    debouncedDestinationSearchKey,
    getOrginCity,
    getDestinationCity,
    orginCityData,
    destinationCityData,
    setOrginCityData,
    setDestinationCityData,
}: Props) => {
    const searchDetails = useSelector(
        (state: RootState) => state.reducer.logisticsV3.searchDetails
    );

    useEffect(() => {
        const timeout = setTimeout(() => {
            getOrginCity(debouncedOrginSearchKey);
            getDestinationCity(debouncedDestinationSearchKey);
        }, 500);

        return () => clearTimeout(timeout);
    }, [debouncedOrginSearchKey, debouncedDestinationSearchKey, getDestinationCity, getOrginCity]);

    useEffect(() => {
        if (destinationCityData.length === 0 && searchDetails.destinationCity.value) {
            setDestinationCityData(searchDetails.destinationCity.options);
        }

        if (orginCityData.length === 0 && searchDetails.originCity.value) {
            setOrginCityData(searchDetails.originCity.options);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};
