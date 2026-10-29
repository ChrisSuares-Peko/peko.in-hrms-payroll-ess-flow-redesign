import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { sendEmail } from '../../api/dashBoardIndex';

export function useSendEmail() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const sendEmails = useCallback(
        async (holidayId: string) => {
            setIsLoading(true);
            try {
                const data = await sendEmail({
                    userId: id,
                    userType: role,
                    holidayId,
                });
                setIsLoading(false);
                return !!data;
            } catch (error) {
                setIsLoading(false);
                return false;
            }
        },
        [id, role]
    );

    return { sendEmails, isLoading };
}
