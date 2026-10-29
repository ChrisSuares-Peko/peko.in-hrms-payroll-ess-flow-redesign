import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { setGstandPanInfo } from '@src/slices/userSlice';

import { updateGstandPanDetails } from '../api/companyInfo';
import { UpdateGstandPan } from '../types/index';

export function useUpdateGstandPan() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const updateGSTandPAN = useCallback(
        async (payload: UpdateGstandPan) => {
            const data = await updateGstandPanDetails({
                ...payload,
                userId: id,
                userType: role,
            });
            if (data) {
                dispatch(setGstandPanInfo(true));
                // dispatch(
                //     showToast({
                //         description: 'Gst and pan details added successfully',
                //         variant: 'success',
                //     })
                // );
            }
            return data;
        },
        [id, role, dispatch]
    );
    return { updateGSTandPAN };
}
