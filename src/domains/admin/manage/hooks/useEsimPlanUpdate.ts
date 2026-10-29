import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getCountriesApi, putUpdateEsimPlan, createEsimPlan } from '../api/eSIM';
import { ConnectBody } from '../types/connect';
import { DropDown, EsimPlan } from '../types/eSIM';

export default function useConnectUpdate(searchText: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [responseData, setResponseData] = useState<ConnectBody | {}>();
    const [coverageData, setCoverageData] = useState<DropDown>();
    const [isLoading, setIsLoading] = useState(false);
    const [countryLoading, setCountryLoading] = useState(false);
    const dispatch = useAppDispatch();

    const updateEsimPlanDetails = useCallback(
        async (eSimUpdatedData: EsimPlan) => {
            setIsLoading(true);
            const response: {} | false = await putUpdateEsimPlan({
                userId: id,
                userType: role,
                ...eSimUpdatedData,
            });

            if (response !== false) {
                dispatch(
                    showToast({
                        description: `eSIM updated successfully`,
                        variant: 'success',
                    })
                );
            }

            setResponseData(response);
            setIsLoading(false);
            return response;
        },
        [dispatch, id, role]
    );

    const getAllCoverages = useCallback(async () => {
        // setIsLoading(true);
        setCountryLoading(true);
        const data = await getCountriesApi({
            userId: id,
            userType: role,
            searchText,
        });
        if (data) {
            const arr = data.map(item => ({
                value: item.id,
                label: item.name,
                network: item.countries?.[0]?.operators?.length || 0,
                provider: item?.label,
                countries: item?.countries,
                countryIso2: item?.countries?.[0]?.iso2,
                indicator: item?.countries?.[0]?.indicator,
            }));
            setCoverageData(arr);
            setIsLoading(false);
        }
        setCountryLoading(false);
        // setIsLoading(false);
    }, [id, role, searchText]);

    const handleEsimPlanCreation = async (payload: EsimPlan) => {
        setIsLoading(true);
        const response = await createEsimPlan({
            ...payload,
            userId: id,
            userType: role,
        });

        if (response !== false) {
            dispatch(
                showToast({
                    description: `eSIM plan added successfully`,
                    variant: 'success',
                })
            );
        }

        setResponseData(response);
        setIsLoading(false);
        return response;
    };

    useEffect(() => {
        getAllCoverages();
    }, [getAllCoverages]);

    return {
        handleEsimPlanCreation,
        responseData,
        isLoading,
        updateEsimPlanDetails,
        coverageData,
        countryLoading,
    };
}
