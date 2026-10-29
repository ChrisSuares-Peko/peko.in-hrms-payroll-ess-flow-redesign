import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getBankDetails, getUserDetails } from '../api/index';
import { userBankDetailsResponse, userDetailsResponse } from '../types/index';

export default function GetUserDetails() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [userDetails, setUserDetails] = useState<any>();
    const [bankDetails, setBankDetails] = useState<userBankDetailsResponse>();
    const [isLoading, setIsLoading] = useState(true);

    const getUserInfo = useCallback(async () => {
        const data: any | false = await getUserDetails({
            userId: id,
            userType: role,
        });
        if (data) {
            const userDetailData = data as userDetailsResponse;
            setUserDetails(userDetailData);
        }
        const details: userBankDetailsResponse | false = await getBankDetails({
            userId: id,
            userType: role,
        });
        if (details) {
            const userDetailData = details as userBankDetailsResponse;
            setBankDetails(userDetailData);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getUserInfo();
    }, [getUserInfo]);

    return { userData: userDetails, bankData: bankDetails, loader: isLoading };
}
