import { useCallback, useEffect, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { hotelAndRoomDetails } from '../Api';
import { getDetails } from '../slices/getHotelSlice';

export default function useHotelDetailsApi(conversationId: string) {
    const dispatch = useAppDispatch();
    const location = useLocation();
    const { key } = location.state || {};
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const hotelDetails = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await hotelAndRoomDetails({
            userId: id,
            userType: role,
            Hotelcodes: conversationId,
        });

        if (data) {
            setIsLoading(false);

            dispatch(getDetails(data.response as any));
        } else {
            setIsLoading(false);
            navigate(
                `${paths.dashboard.corporateTravel}/${paths.hotels.index}/${paths.hotels.details}`
            );
        }
    }, [dispatch, id, role, conversationId, navigate]);
    useEffect(() => {
        if (key) {
            hotelDetails();
        }
    }, [hotelDetails, key]);

    return { isLoading };
}
