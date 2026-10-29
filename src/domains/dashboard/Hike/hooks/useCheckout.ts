import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import GetSurcharge from './useSurchargeApi';
import { setPaymentData } from '../../payments/slices/payment';

export default function useCheckout() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { hikeArray } = useAppSelector(state => state.reducer.hike);
    const amount = hikeArray?.reduce((acc: any, item: any) => acc + item.totalPrice, 0);

    const updatedHikes = hikeArray.map(({ logo: any, ...rest }) => rest);

    const { surchargeData } = GetSurcharge();
    const netAmount = amount + (surchargeData?.surcharge ? parseFloat(surchargeData.surcharge) : 0);
    const handleSubmission = useCallback(async () => {
        const billSummary = [
            {
                key: 'Service name',
                value: 'Hike',
            },
            // {
            //     key: 'Name',
            //     value: 'Hike',
            // },

            {
                key: 'Amount',
                value: formatNumberWithLocalString(amount),
            },
        ];

        const paymentSummary = [
            {
                key: 'Platform fee (inclusive of GST)',
                value: `₹ ${formatNumberWithLocalString(surchargeData?.surcharge ?? 0)}`,
            },
        ];

        const requestBody = {
            amount,
            payCashback: false,
            selectedHikes: updatedHikes,
            accessKey: accessKeys.hike,
        };

        dispatch(
            setPaymentData({
                billSummary,
                paymentSummary,
                totalAmount: netAmount,
                title: 'Bill Summary',
                payload: requestBody,
                url: 'purchase/hike/payment',
                earningCashbackAmount: Number(surchargeData?.corporateCashback) || 0,
            })
        );

        navigate(paths.dashboard.payments);
    }, [
        amount,
        dispatch,
        navigate,
        netAmount,
        surchargeData?.corporateCashback,
        surchargeData?.surcharge,
        updatedHikes,
    ]);

    return { handleSubmission };
}
