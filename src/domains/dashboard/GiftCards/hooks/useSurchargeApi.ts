import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';

// import { getSurcharge } from '../api';

import { SurchargeResponse } from '../types/types';

export default function GetSurcharge() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [surchargeDetails, setSurchargeDetails] = useState<SurchargeResponse>();
    const [isLoading, setIsLoading] = useState(true);
    const formData = useAppSelector(state => state.reducer.giftcardCheckout.formDetails);
    const productDetails = useAppSelector(state => state.reducer.giftcardCheckout.productDetails);

    const amount = Number(formData.product);
    const quantity = parseInt(formData.quantity, 10) || 1;
    const getSurchargeData = useCallback(async () => {
        try {
            const data: SurchargeResponse | false = await getSurcharge({
                userId: id,
                userType: role,
                amount,
                accessKey: productDetails.accessKey,
                quantity,
            });

            if (data) {
                const walletDetailData = data as SurchargeResponse;
                setSurchargeDetails(walletDetailData);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Failed to fetch surcharge :', error);
        } finally {
            setIsLoading(false);
        }
    }, [id, role, amount, quantity, productDetails.accessKey]);

    useEffect(() => {
        if (amount > 0) {
            getSurchargeData();
        }
    }, [getSurchargeData, amount]);

    return { surchargeData: surchargeDetails, isLoading };
}
