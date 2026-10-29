import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllData } from '../api/index';
import { UserData } from '../types/index';

const useGetData = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [profileData, setProfileData] = useState<UserData>();
    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: UserData | false = await getAllData({
            userId: id,
            userType: role,
        });
        if (data) {
            setProfileData(data);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getAllTableData();
    }, [getAllTableData, refresh]);

    return { isLoading, profileData, setRefresh };
};

export default useGetData;
