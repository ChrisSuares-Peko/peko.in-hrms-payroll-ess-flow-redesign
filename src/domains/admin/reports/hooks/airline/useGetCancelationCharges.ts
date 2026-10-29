import { useState } from 'react';

import { CancelationCharge } from '@src/domains/dashboard/Airline/types/manageBookings';
import { useAppSelector } from '@src/hooks/store';

import { cancellationChargesApi } from '../../api/airline/airline';

export const useGetCancelationCharges = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setIsLoading] = useState(false);

    const getCancellationCharges = async (flightBookingId: string) => {
        if (!flightBookingId) return false;
        setIsLoading(true);
        const resp: CancelationCharge | false = await cancellationChargesApi({
            userId: id,
            userType: role,
            flightBookingId,
        });
        if (resp && resp.RefundAmount !== undefined && resp.CancellationCharge !== undefined) {
            setIsLoading(false);
            return {
                RefundAmount: resp.RefundAmount,
                CancellationCharge: resp.CancellationCharge,
            };
        }
        setIsLoading(false);
        return false;
    };

    return {
        getCancellationCharges,
        isLoading,
    };
};
