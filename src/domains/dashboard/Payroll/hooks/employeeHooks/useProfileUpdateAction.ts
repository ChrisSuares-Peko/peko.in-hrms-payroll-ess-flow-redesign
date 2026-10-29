import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { approveProfileUpdateRequest, rejectProfileUpdateRequest } from '../../api/profileUpdateRequestApi';

export const useProfileUpdateAction = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);

    const approve = async (requestId: string) => {
        setApproving(true);
        const response = await approveProfileUpdateRequest({ userType: role, userId: id, requestId });
        setApproving(false);

        dispatch(
            showToast({
                variant: response ? 'success' : 'error',
                description: response ? 'Profile update request approved' : 'Failed to approve request',
            })
        );
        return Boolean(response);
    };

    const reject = async (requestId: string) => {
        setRejecting(true);
        const response = await rejectProfileUpdateRequest({ userType: role, userId: id, requestId });
        setRejecting(false);

        dispatch(
            showToast({
                variant: response ? 'success' : 'error',
                description: response ? 'Profile update request rejected' : 'Failed to reject request',
            })
        );
        return Boolean(response);
    };

    return { approve, reject, approving, rejecting };
};
