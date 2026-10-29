import { useEffect, useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { lookupInternationalPostcodeApi, lookupPostcodeApi } from '../../api';
import { updateShipmentDetails } from '../../slice/logisticsSlice';

export const usePostcodeLookup = (postcode: string, isReceiver = false) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { shipmentType, shipmentDetails } = useAppSelector(state => state.reducer.logisticsV3);
    const countryCode = shipmentDetails.destinationCity?.countryCode || '';

    const [city, setCity] = useState('');
    const [resolvedState, setResolvedState] = useState('');
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [isInvalid, setIsInvalid] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isInternational = isReceiver && shipmentType === 'international';

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        if (!postcode || postcode.length < 4) {
            setCity('');
            setResolvedState('');
            setIsInvalid(false);
            return () => {
                if (timerRef.current) clearTimeout(timerRef.current);
            };
        }

        timerRef.current = setTimeout(async () => {
            setIsLookingUp(true);
            setIsInvalid(false);

            let result: { city: string; state: string } | false = false;

            if (isInternational && countryCode) {
                result = await lookupInternationalPostcodeApi({
                    userType: role,
                    userId: id,
                    postcode,
                    countryCode,
                });
            } else {
                result = await lookupPostcodeApi({ userType: role, userId: id, postcode });
            }

            if (result) {
                setCity(result.city);
                setResolvedState(result.state);
                if (isReceiver) {
                    dispatch(
                        updateShipmentDetails({
                            destinationCity: {
                                city: result.city,
                                state: result.state,
                            },
                        })
                    );
                } else {
                    dispatch(
                        updateShipmentDetails({
                            originCity: {
                                city: result.city,
                                state: result.state,
                                countryCode: 'IN',
                                countryName: 'India',
                            },
                        })
                    );
                }
            } else {
                setCity('');
                setResolvedState('');
                setIsInvalid(true);
            }

            setIsLookingUp(false);
        }, 600);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postcode, countryCode]);

    return { city, state: resolvedState, isLookingUp, isInvalid };
};
