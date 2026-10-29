import { useCallback, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { sendEmaill } from '../api/index';
import { sendEmailTypes } from '../types/index';

export default function useSentEmail() {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const dispatch = useAppDispatch();
    const sendEmail = useCallback(
        async (payload: sendEmailTypes) => {
            setIsLoading(true);
            const resp: boolean = await sendEmaill({
                userId: id,
                userType: role,
                ...payload,
            });

            if (resp) {
                dispatch(
                    showToast({
                        description: `Email has been sent`,
                        variant: 'success',
                    })
                );
            } else {
                dispatch(
                    showToast({
                        description: `Some error happened while sending`,
                        variant: 'error',
                    })
                );
            }
            return setIsLoading(false);
        },
        [dispatch, id, role]
    );

    return { sendEmail, loader: isLoading };
}
