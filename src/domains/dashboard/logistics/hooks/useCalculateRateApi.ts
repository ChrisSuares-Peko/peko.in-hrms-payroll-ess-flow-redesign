import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { calculateRate } from '../api/index';
import { ICalculateRateResponse, shipmentDetailsMin } from '../types/index';

export const useCalculateRateApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [resultData, setResultData] = useState({});
    const { originAddress, destinationAddress } = useAppSelector(state => state.reducer.logistics);
    const [isLoading, setIsLoading] = useState(false);

    const handleCalculateRate = async (shipmentDetails: shipmentDetailsMin) => {
        setIsLoading(true);
        const response: ICalculateRateResponse | false = await calculateRate({
            userId: id,
            userType: role,
            originPinCode: originAddress.PostCode,
            destinationPinCode: destinationAddress.PostCode,
            ...shipmentDetails,
        });
        if (response) {
            const result = {
                charges: response.charges,
                city: response.city,
            };

            setResultData(result);
            setIsLoading(false);
            return result;
        }
        setIsLoading(false);
        return false;
    };

    return { data: resultData, isLoading, handleCalculateRate };
};
