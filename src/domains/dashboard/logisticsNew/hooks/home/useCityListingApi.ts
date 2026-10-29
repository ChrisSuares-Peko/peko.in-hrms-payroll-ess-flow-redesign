import { useCallback, useState } from 'react';

import { DropDown } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { cityDetails, cityListing } from '../../api';
import { updateShipmentDetails } from '../../slice/logisticsSlice';
import { CityDetailsResponse, CityListingResponse } from '../../types';

export const useCityListingApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [cityList, setcityList] = useState<DropDown>([]);

    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const getCityList = useCallback(
        async (searchText: string) => {
            if (!searchText) return;
            setIsLoading(true);
            const data: CityListingResponse | false = await cityListing({
                userId: id,
                userType: role,
                searchText,
            });
            if (data) {
                setcityList(data.cities);
            }
            setIsLoading(false);
        },
        [id, role]
    );

    const getCityDetails = useCallback(
        async (placeId: string, isOrginCity: boolean) => {
            if (!placeId) return;
            setIsLoading(true);
            const data: CityDetailsResponse | false = await cityDetails({
                userId: id,
                userType: role,
                placeId,
            });
            if (data) {
                if (isOrginCity) {
                    dispatch(
                        updateShipmentDetails({
                            originCity: data,
                        })
                    );
                } else {
                    dispatch(
                        updateShipmentDetails({
                            destinationCity: data,
                        })
                    );
                }
            }
            setIsLoading(false);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [id, role]
    );

    return { cityList, isLoading, getCityDetails, getCityList, setcityList };
};
