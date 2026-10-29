import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';

import { getOneModificationData } from '../../api/airline/airline';

const useAirlineModificationDetails = (bookingId: number | string) => {
    const navigate = useNavigate();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [bookingDetails, setBookingDetails] = useState<any>();

    const getAllTableData = useCallback(async () => {
        if (!bookingId) {
            navigate('/system-user/reports');
        }
        setIsLoading(true);
        const data: any | false = await getOneModificationData(
            {
                userId: id,
                userType: role,
            },
            bookingId
        );
        setIsLoading(false);

        if (data) {
            setBookingDetails(data);
        } else {
            navigate('/system-user/reports');
        }
    }, [id, bookingId, role, navigate]);

    useEffect(() => {
        getAllTableData();
    }, [getAllTableData]);
    return {
        isLoading,
        data: bookingDetails,
        getAllTableData,
    };
};

export default useAirlineModificationDetails;
