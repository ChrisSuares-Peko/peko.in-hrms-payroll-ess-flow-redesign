import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getUserDetails } from '../api/index';
import { userDetailsResponse } from '../types/types';

export default function GetUserDetails() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [userDetails, setUserDetails] = useState<userDetailsResponse>();
    const [isLoading, setIsLoading] = useState(true);

    const getUserInfo = useCallback(async () => {
        try {
            const data: userDetailsResponse | false = await getUserDetails({
                userId: id,
                userType: role,
            });
            if (data) {
                const userDetailData = data as userDetailsResponse;
                setUserDetails(userDetailData);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Failed to fetch user details:', error);
        } finally {
            setIsLoading(false);
        }
    }, [id, role]);

    useEffect(() => {
        getUserInfo();
    }, [getUserInfo]);

    return { userData: userDetails, isLoading };
}
