import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { fetchSSRAPI } from '../api';
import { SeatResponseType } from '../types/ancilaryType';
import { Baggage, MealDynamic } from '../types/slices';

type Props = {
    setShowSpinner: (value: boolean) => void;
    handleBooking?: () => void;
};

export default function useFetchSSR({ setShowSpinner, handleBooking }: Props) {
    const navigate = useNavigate();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { selectedAirline, TraceId, selectedInbountAirline } = useAppSelector(
        state => state.reducer.airline
    );
    const [meal, setMeal] = useState<MealDynamic[][]>();
    const [seat, setSeat] = useState<SeatResponseType[]>();
    const [baggage, setBaggage] = useState<Baggage[][]>();

    const fetchSSR = useCallback(async () => {
        // Validate required fields before making API call
        if (
            !TraceId ||
            TraceId.trim() === '' ||
            !selectedAirline?.ResultIndex ||
            selectedAirline.ResultIndex.trim() === '' ||
            !selectedAirline?.price ||
            selectedAirline.price === 0
        ) {
            setShowSpinner(false);
            if (handleBooking) {
                handleBooking();
                return;
            }
            // Navigate to search page when timer expires (same as timer expiration logic)
            navigate(`${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.results}`, {
                state: { flightkey: 'searchFlights' },
            });
            return;
        }

        setShowSpinner(true);
        const res = await fetchSSRAPI({
            payload: {
                ResultIndex: selectedAirline.ResultIndex,
                InbountResultIndex: selectedInbountAirline?.ResultIndex || '',
                TraceId,
                price: selectedAirline.price,
            },
            userType: role,
            userId: id,
        });
        if (res) {
            setMeal(res.MealDynamic);
            setBaggage(res.Baggage);
            setSeat(res.SeatDynamic);
        } else {
            if (handleBooking) {
                handleBooking();
                return;
            }
            navigate(
                `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.results}/${paths.airline.details}/${paths.airline.summary}`
            );
        }
        setShowSpinner(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAirline, TraceId, id, role, navigate, handleBooking]);

    useEffect(() => {
        fetchSSR();
    }, [fetchSSR]);

    return { meal, seat, baggage, fetchSSR };
}
