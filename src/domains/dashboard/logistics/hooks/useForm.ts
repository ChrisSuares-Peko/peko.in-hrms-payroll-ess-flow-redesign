import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';

import { setPaymentData } from '../../payments/slices/payment';
import { resetLogisticsDataState } from '../slice/logisticsSlice';
import { formalTextFormatter } from '../utils/helperFunctions';

export default function useForm() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { originAddress, destinationAddress, shipmentDetails, shippingAmount } = useAppSelector(
        state => state.reducer.logistics
    );

    const total = shippingAmount.charges ? shippingAmount.charges : 0;

    const handleLogisticsSubmission = useCallback(async () => {
        const billSummary = [
            {
                key: 'Service Name',
                value: 'Logistics',
            },
            {
                key: 'Service Type',
                value: formalTextFormatter(shipmentDetails.serviceType) ?? '',
            },
            {
                key: 'Order Category',
                value: shipmentDetails.orderCategory ?? '',
            },
            {
                key: 'Amount',
                value: shippingAmount.charges ?? 0,
            },
        ];

        const paymentSummary = [
            {
                key: 'Platform fee (inclusive of GST)',
                value: new Intl.NumberFormat('en-IN').format(0) ?? 0,
            },
        ];

        const requestBody = {
            pickupLocation: originAddress.id,
            senderAddress: originAddress,
            customerName: destinationAddress.Line1,
            customerAddress: destinationAddress.Line2,
            customerCity: destinationAddress.City,
            customerPinCode: destinationAddress.PostCode,
            customerMobileNo: destinationAddress.Line3,

            orderDate: shipmentDetails.orderDate,
            orderAmount: shippingAmount.charges,
            orderWeight: shipmentDetails.packageWeight,
            orderCategory: shipmentDetails.orderCategory,
            serviceType: shipmentDetails.serviceType,
            sendSms: shipmentDetails.recieveSMS,
            accessKey: accessKeys.shipmentServices,
        };
        dispatch(
            setPaymentData({
                billSummary,
                paymentSummary,
                totalAmount: total,
                title: 'Bill Summary',
                payload: requestBody,
                url: 'travel/logistics/payment',
                earningCashbackAmount: 0,
            })
        );
        navigate(paths.dashboard.payments);
        dispatch(resetLogisticsDataState());
    }, [
        shippingAmount,
        dispatch,
        navigate,
        originAddress,
        destinationAddress,
        shipmentDetails,
        total,
    ]);

    return { handleLogisticsSubmission };
}
