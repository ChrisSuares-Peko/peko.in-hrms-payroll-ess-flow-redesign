import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createReferal, updatereferal } from '../api/refferalCode';
import { Referral, newReferal } from '../types/refferalCode';

type Props = {
    handleCancel: () => void;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};

const UseUpdateReferalCodes = ({ handleCancel, setRefresh }: Props) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const updateCurrentreferal = useCallback(
        async (payload: newReferal) => {
            setIsLoading(true);
            const data: Referral | false = await updatereferal({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                handleCancel();
                setRefresh(true);
                dispatch(
                    showToast({
                        description: `Referral code updated successfully`,
                        variant: 'success',
                    })
                );
            }
            setIsLoading(false);
        },
        [id, role, setRefresh, handleCancel, dispatch]
    );
    const createNewReferal = useCallback(
        async (payload: newReferal) => {
            setIsLoading(true);
            const data: Referral | false = await createReferal({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                handleCancel();
                setRefresh(true);
                dispatch(
                    showToast({
                        description: `Referral code added successfully`,
                        variant: 'success',
                    })
                );
            }
            setIsLoading(false);
        },
        [id, role, setRefresh, handleCancel, dispatch]
    );

    return { isLoading, createNewReferal, updateCurrentreferal };
};

export default UseUpdateReferalCodes;
