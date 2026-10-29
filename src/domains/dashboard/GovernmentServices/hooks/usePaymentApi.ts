import { useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { SurchargeResponse } from '@customtypes/general';
import { setPaymentData } from '@src/domains/dashboard/payments/slices/payment';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { getSurcharge } from '@src/services/surcharge';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { serviceAccessKeyMap } from '../utils';

interface PaymentSubmissionParams {
    serviceId: number;
    dbServiceId: string;
    serviceName: string;
    governmentFee: number | 'Free';
    pekoFee: number;
    applicationId: number | null;
}

export default function usePaymentApi() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);
    const [surchargeData, setSurchargeData] = useState<SurchargeResponse | undefined>();
    const [isSurchargeLoading, setIsSurchargeLoading] = useState(false);

    const fetchSurcharge = useCallback(async (serviceId: number, amount: number) => {
        const accessKey = serviceAccessKeyMap[serviceId];
        if (!accessKey || !amount) return;

        setIsSurchargeLoading(true);
        const data = await getSurcharge({ userId, userType: role, amount, accessKey });
        setIsSurchargeLoading(false);

        if (data) {
            setSurchargeData(data as SurchargeResponse);
        }
    }, [userId, role]);

    const handleSubmission = useCallback(
        async ({
            serviceId,
            dbServiceId,
            serviceName,
            governmentFee,
            pekoFee,
            applicationId,
        }: PaymentSubmissionParams) => {
            setLoading(true);

            const govFee = governmentFee === 'Free' ? 0 : (governmentFee as number);
            const baseAmount = pekoFee + govFee;

            const accessKey = serviceAccessKeyMap[serviceId];
            let latestSurcharge = surchargeData;

            if (accessKey && baseAmount) {
                const data = await getSurcharge({ userId, userType: role, amount: baseAmount, accessKey });
                if (data) {
                    latestSurcharge = data as SurchargeResponse;
                    setSurchargeData(latestSurcharge);
                }
            }

            const totalAmount =
                baseAmount +
                Number(latestSurcharge?.surcharge ?? 0) -
                Number(latestSurcharge?.corporateCashback ?? 0);

            const billSummary = [
                { key: 'Service name', value: serviceName },
                {
                    key: 'Government Fee',
                    value: governmentFee === 'Free' ? 'Free' : `₹ ${formatNumberWithLocalString(govFee)}`,
                },
                { key: 'Peko Service Fee', value: `₹ ${formatNumberWithLocalString(pekoFee)}` },
            ];

            const paymentSummary = [
                ...(Number(latestSurcharge?.surcharge ?? 0) > 0
                    ? [
                          {
                              key: 'Platform fee (inclusive of GST)',
                              value: `₹ ${formatNumberWithLocalString(Number(latestSurcharge!.surcharge))}`,
                          },
                      ]
                    : []),
            ];

            const requestBody = {
                applicationId,
                accessKey,
                amount: baseAmount,
                currentUrl: window.location.href,
            };

            dispatch(
                setPaymentData({
                    title: 'Bill Summary',
                    billSummary,
                    paymentSummary,
                    totalAmount,
                    payload: requestBody,
                    url: 'purchase/govt-services/applications/payment',
                    earningCashbackAmount: Number(latestSurcharge?.corporateCashback) || 0,
                    successPath: `${paths.dashboard.governmentServices}/${paths.governmentServices.service}/${dbServiceId}/success`,
                })
            );

            navigate(paths.dashboard.payments);
            setLoading(false);
        },
        [dispatch, navigate, userId, role, surchargeData]
    );

    return { handleSubmission, loading, surchargeData, isSurchargeLoading, fetchSurcharge };
}
