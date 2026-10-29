import { useCallback, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { sendEmail } from '../api';

export default function useSendMail() {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const dispatch = useAppDispatch();
    const sendMail = useCallback(
        async (payload: any) => {
            setIsLoading(true);

            const resp: boolean = await sendEmail({
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

    return { sendMail, loading: isLoading };
}
