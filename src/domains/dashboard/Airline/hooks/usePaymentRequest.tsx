import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { accessKeys } from '@utils/accessKeys';

import { airlinePaymentsApi } from '../api/index';
import { setPaymentSuccessResponse } from '../slices/airlineSlice';
import { ProvBookingSuccess } from '../types/provBooking';

export default function useAirlinePayment() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { provBookingSuccess, bookingData } = useAppSelector(state => state.reducer.airline);
    const [isLoading, setIsLoading] = useState(true);
    const provBookingData: ProvBookingSuccess = provBookingSuccess as ProvBookingSuccess;
    const [paymentData, setPaymentData] = useState<boolean | false>();
    const dispatch = useAppDispatch();

    const getAirlinePayments = async () => {
        const paymentRequestData = {
            offerId: provBookingData.data[0].offerId,
            conversationId: provBookingData.conversationId,
            fare: provBookingData.data[0].fare.totalFare,
            totalAncillaryPrice: 0,
            ancillaryDetails: [],
            passengers: bookingData.passengers,
            isLcc: provBookingData.data[0].detail.lcc,
            // customerInfo: {
            //     emailAddress: bookingData.customerInfo.emailAddress,
            // },
            amount: provBookingData.data[0].fare.totalFare,
            currencyCode: 'INR',
            accessKey: accessKeys.airline,
        };

        const data = await airlinePaymentsApi({
            userId: id,
            userType: role,
            paymentRequestData,
        });
        if (data) {
            dispatch(setPaymentSuccessResponse(data));
            setIsLoading(false);
            setPaymentData(data.meta);
            return data.meta;
        }
        setIsLoading(false);
        return paymentData;
    };

    return { HandlePayment: getAirlinePayments, paymentData, isLoading };
}
