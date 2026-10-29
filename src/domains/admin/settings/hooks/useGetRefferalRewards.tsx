import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getRefferalReward, updateRefferalReward } from '../api/refferalCode';
import { ReferaRewardlResponse } from '../types/refferalCode';

const useGetRefferalRewards = (handleCancel: () => void) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [tableData, setTableData] = useState<ReferaRewardlResponse>();
    const dispatch = useAppDispatch();
    const getDataFromApi = useCallback(async () => {
        setIsLoading(true);
        const data: ReferaRewardlResponse | false = await getRefferalReward({
            userId: id,
            userType: role,
        });
        if (data) {
            setTableData(data);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role]);
    const updateData = useCallback(
        async (reward: string | number) => {
            setIsLoading(true);
            const data: ReferaRewardlResponse | false = await updateRefferalReward({
                userId: id,
                userType: role,
                reward,
            });
            if (data) {
                handleCancel();
                setRefresh(true);
                dispatch(
                    showToast({
                        description: `Referral reward updated successfully`,
                        variant: 'success',
                    })
                );
            }
            setIsLoading(false);
        },
        [dispatch, handleCancel, id, role]
    );

    useEffect(() => {
        getDataFromApi();
    }, [getDataFromApi, refresh]);

    return {
        isLoading,
        tableData,
        updateData,
    };
};

export default useGetRefferalRewards;
