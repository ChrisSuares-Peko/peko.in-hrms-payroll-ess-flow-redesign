import { useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';

import useSurchargeApi from './useSurchargeApi';
import { setPaymentData } from '../../payments/slices/payment';
import { setFormData } from '../slices/worksSlice';
import { WorksFormData } from '../type';

export default function useForm() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { surchargeData, getSurchargeData } = useSurchargeApi();
    const [loading, setLoading] = useState(false);

    const handleSubmission = useCallback(
        async (values: WorksFormData) => {
            const { pocName, email, mobile, requirement, planId, workId, price, workName } = values;

            setLoading(true);
            try {
                const amount = price ? Number(price) : 0;

                const surcharge = await getSurchargeData(amount);
                if (!surcharge) {
                    return;
                }

                const surchargeAmount = surcharge?.surcharge ? parseFloat(surcharge.surcharge) : 0;
                const total = amount + surchargeAmount;

                dispatch(
                    setFormData({
                        pocName,
                        email,
                        mobile,
                        requirement,
                    })
                );

                const billSummary = [
                    {
                        key: 'Service name',
                        value: 'Works',
                    },
                    {
                        key: 'Works name',
                        value: `${workName}`,
                    },
                    {
                        key: 'Plan name',
                        value: values?.planName ?? '',
                    },
                    {
                        key: 'Amount',
                        value: `${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(amount)}`,
                    },
                ];

                const paymentSummary = [
                    {
                        key: 'Platform fee (inclusive of VAT)',
                        value: `₹ ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(surchargeAmount)}`,
                    },
                ];

                const requestBody = {
                    planId,
                    amount,
                    pocName,
                    email,
                    mobile,
                    requirement,
                    workId,
                    accessKey: accessKeys.pekoWorks,
                    currentUrl: window.location.href,
                };

                dispatch(
                    setPaymentData({
                        billSummary,
                        paymentSummary,
                        totalAmount: total,
                        title: 'Bill Summary',
                        payload: requestBody,
                        url: 'officeAndBusiness/works/payment',
                        earningCashbackAmount:
                            Number(surchargeData && surchargeData?.corporateCashback) || 0,
                    })
                );

                navigate(paths.dashboard.payments);
            } finally {
                setLoading(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dispatch, navigate, surchargeData]
    );

    return { handleSubmission, loading };
}
