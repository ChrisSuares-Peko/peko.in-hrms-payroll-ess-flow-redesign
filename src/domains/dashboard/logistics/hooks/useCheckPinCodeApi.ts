/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { checkPinApi } from '../api/index';
import { CheckPincodeResponse } from '../types/pincode';

export function useCheckPinCodeAvailibilityApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { shipmentDetails } = useAppSelector(state => state.reducer.logistics);
    const [isCheckPinLoading, setIsCheckPinLoading] = useState(false);
    const [isCheckPinErr, setIsCheckPinErr] = useState(false);
    const [CityVal, setCity] = useState('');
    const dispatch = useAppDispatch();
    const handleCheckPincode = useCallback(
        async (pin: string) => {
            let returnVal: {
                success: boolean;
                message: string;
                data: string;
                minWeight?: number;
                maxWeight?: number;
            } = { success: false, message: '', data: '' };
            if (pin) {
                setIsCheckPinLoading(true);
                const response: CheckPincodeResponse | false = await checkPinApi({
                    userType: role,
                    userId: id,
                    pinCode: pin,
                    serviceType: shipmentDetails.serviceType,
                });
                if (response) {
                    const { city, data } = response;
                    if (city) {
                        let minWeight = 0;
                        let maxWeight = 0;
                        data.forEach(obj => {
                            if (obj.weight_from < minWeight) {
                                minWeight = obj.weight_from;
                            }
                            if (obj.weight_to > maxWeight) {
                                maxWeight = obj.weight_from;
                            }
                        });
                        setCity(city);
                        setIsCheckPinLoading(false);
                        setIsCheckPinErr(false);
                        returnVal = {
                            success: true,
                            message: 'Pin code available',
                            data: city,
                            minWeight,
                            maxWeight,
                        };
                    }
                } else {
                    dispatch(
                        showToast({
                            description:
                                'The pin code is not servicable for the select service type',
                            variant: 'error',
                        })
                    );
                    returnVal = {
                        success: false,
                        message: 'The pin code is not servicable for the select service type',
                        data: '',
                    };
                    setIsCheckPinErr(true);
                    setCity('');
                    setIsCheckPinLoading(false);
                }
            }
            return returnVal;
        },
        [id, role, shipmentDetails]
    );

    // useEffect(() => {
    //     handleCheckPincode(pin);
    // }, [handleCheckPincode]);

    return { CityVal, isCheckPinLoading, isCheckPinErr, handleCheckPincode };
}
