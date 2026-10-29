import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getBankDetails } from '../api/index';
import { userBankDetailsResponse } from '../types/index';

export default function GetUserBankDetails() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [userDetails, setUserDetails] = useState<userBankDetailsResponse>();
    const [isLoading, setIsLoading] = useState(true);

    const getUserBankInfo = useCallback(async () => {
        const data: userBankDetailsResponse | false = await getBankDetails({
            userId: id,
            userType: role,
        });
        if (data) {
            const userDetailData = data as userBankDetailsResponse;
            setUserDetails(userDetailData);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role]);

    useEffect(() => {
        getUserBankInfo();
    }, [getUserBankInfo]);

    return { bankData: userDetails, bankDataLoader: isLoading };
}
