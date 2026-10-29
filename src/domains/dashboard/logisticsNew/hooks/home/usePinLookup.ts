import { useEffect, useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { lookupInternationalPostcodeApi, lookupPostcodeApi } from '../../api';

export const usePinLookup = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLookingUp, setIsLookingUp] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

    const handlePinLookup = (
        pin: string,
        setFieldValue: (field: string, value: string) => void,
        countryCode?: string
    ) => {
        const minLength = countryCode ? 3 : 6;
        if (!pin || pin.length < minLength) return;
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(async () => {
            setIsLookingUp(true);
            const result = countryCode
                ? await lookupInternationalPostcodeApi({ userType: role, userId: id, postcode: pin, countryCode })
                : await lookupPostcodeApi({ userType: role, userId: id, postcode: pin });
            if (result) {
                setFieldValue('city', result.city);
                setFieldValue('state', result.state);
            } else {
                setFieldValue('city', '');
                setFieldValue('state', '');
                dispatch(showToast({ description: 'City/State not found for this pincode', variant: 'error' }));
            }
            setIsLookingUp(false);
        }, 600);
    };

    return { isLookingUp, handlePinLookup };
};
