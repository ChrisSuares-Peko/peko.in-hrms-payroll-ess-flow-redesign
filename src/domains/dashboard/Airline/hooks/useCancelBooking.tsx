import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { cancellationChargesApi, getCancelBooking } from '../api';
import { IAncCancellationPostData } from '../types/apiPayloadTypes';
import { CancelationCharge } from '../types/manageBookings';

export default function useCancelTicket(bookingId: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancellationCharges, setCancellationCharges] = useState<CancelationCharge>();
    const [chargesError, setChargesError] = useState(false);

    const HandleCancelTicket = async (postData: IAncCancellationPostData) => {
        setCancelLoading(true);
        const data: any | false = await getCancelBooking({
            userId: id,
            userType: role,
            postData,
        });

        setCancelLoading(false);
        return data;
    };

    const getCancellationCharges = useCallback(async () => {
        const flightBookingId = bookingId;
        if (!flightBookingId) return false;
        setIsLoading(true);
        const resp: CancelationCharge | false = await cancellationChargesApi({
            userId: id,
            userType: role,
            flightBookingId,
        });
        if (resp) {
            setCancellationCharges(resp);
            setChargesError(false);
            setIsLoading(false);
            return true;
        }
        setChargesError(true);
        setIsLoading(false);
        return false;
    }, [id, role, bookingId]);

    useEffect(() => {
        getCancellationCharges();
    }, [getCancellationCharges]);

    return {
        HandleCancelTicket,
        isLoading,
        cancellationCharges,
        cancelLoading,
        chargesError,
    };
}
