import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getProvBooking } from '../api/index';
import { setProvBookingSuccess } from '../slices/airlineSlice';
import { ProvBookingSuccess } from '../types/provBooking';

export default function useProvBooking() {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const bookingData = useAppSelector(state => state.reducer.airline.bookingData);

    const provBooking = async () => {
        setIsLoading(true);

        // Deep copy bookingData to avoid mutating the original state
        const filteredBookingData = JSON.parse(JSON.stringify(bookingData));

        // Filter identity documents
        filteredBookingData.passengers = filteredBookingData.passengers.map((passenger: any) => {
            if (passenger.identityDocuments) {
                passenger.identityDocuments = passenger.identityDocuments.filter(
                    (doc: any) =>
                        doc.idDocumentNumber !== '' &&
                        doc.issuingCountryCode !== '' &&
                        doc.expiryDate !== ''
                );
            }
            return passenger;
        });

        const data: ProvBookingSuccess | false = await getProvBooking({
            userId: id,
            userType: role,
            bookingData: filteredBookingData,
        });

        if (data !== false) {
            dispatch(setProvBookingSuccess(data));
            setIsLoading(false);
            return data;
        }

        setIsLoading(false);
        return false;
    };

    return { handleProvBooking: provBooking, isLoading };
}
