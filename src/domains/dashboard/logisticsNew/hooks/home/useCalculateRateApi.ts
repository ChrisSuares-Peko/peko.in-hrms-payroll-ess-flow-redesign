import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { calculateRate, calculateInternationalRate } from '../../api';
import { setCourierResults, updateShipmentDetails } from '../../slice/logisticsSlice';
import {
    DeliveryCompanyOption,
    CalculateRateResponse,
    ShipmentData,
    InternationalShipmentData,
} from '../../types';

const mapCouriers = (
    companies: CalculateRateResponse['deliveryCompanies']
): DeliveryCompanyOption[] =>
    companies.map(company => ({
        deliveryCompanyId: company.deliveryCompanyId,
        courierName: company.courierName,
        price: Number(company.price),
        serviceType: company.serviceType,
        deliveryType: company.deliveryType,
        avgDeliveryTime: company.avgDeliveryTime,
        logo: company.logo,
        minWeight: company.minWeight,
        maxWeight: company.maxWeight,
    }));

export const useCalculateRateApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { courierResults, shipmentDetails } = useAppSelector(state => state.reducer.logisticsV3);
    const hasStoredResults = courierResults.length > 0;
    const [resultData, setResultData] = useState<DeliveryCompanyOption[] | null>(
        hasStoredResults ? courierResults : null
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isInital, setIsInital] = useState(!hasStoredResults);
    const [isSubmmited, setIsSubmmited] = useState(false);
    const dispatch = useAppDispatch();

    const handleCalculateRate = async (values: ShipmentData) => {
        dispatch(
            updateShipmentDetails({
                weight: values.weight,
                length: values.length,
                width: values.width,
                height: values.height,
                originPostCode: values.originPostCode,
                destinationPostCode: values.destinationPostCode,
            })
        );
        setIsLoading(true);

        const response: CalculateRateResponse | false = await calculateRate({
            userId: id,
            userType: role,
            ...values,
        });

        if (response && Array.isArray(response.deliveryCompanies)) {
            const result = mapCouriers(response.deliveryCompanies);
            setResultData(result);
            dispatch(setCourierResults(result));
            setIsLoading(false);
            setIsInital(false);
            // PROTOTYPE-SETUP: MoEngage analytics call removed (SDK stripped).
            return result;
        }
        setIsSubmmited(true);
        setIsLoading(false);
        return [];
    };

    const handleCalculateInternationalRate = async (values: InternationalShipmentData) => {
        dispatch(
            updateShipmentDetails({
                weight: values.weight,
                length: values.length,
                width: values.width,
                height: values.height,
                originPostCode: values.originPostCode,
                destinationCity: { countryCode: values.destinationCountryCode },
            })
        );
        setIsLoading(true);

        const response: CalculateRateResponse | false = await calculateInternationalRate({
            userId: id,
            userType: role,
            ...values,
        });

        if (response && Array.isArray(response.deliveryCompanies)) {
            const result = mapCouriers(response.deliveryCompanies);
            setResultData(result);
            dispatch(setCourierResults(result));
            setIsLoading(false);
            setIsInital(false);
            return result;
        }
        setIsSubmmited(true);
        setIsLoading(false);
        return [];
    };

    const hideAndResetWhileChange = () => {
        setIsInital(true);
        setResultData([]);
        dispatch(setCourierResults([]));
    };

    return {
        data: resultData,
        isLoading,
        handleCalculateRate,
        handleCalculateInternationalRate,
        isInital,
        hideAndResetWhileChange,
        isSubmmited,
    };
};
