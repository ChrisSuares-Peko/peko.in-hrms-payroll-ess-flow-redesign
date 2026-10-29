import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { holiday } from '../../api/dashBoardIndex';
import { EventData, holidayPayload } from '../../types/dashboardTypes';

export function useAddHoliday() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const addHoliday = useCallback(
        async (payload: holidayPayload) => {
            setIsLoading(true);
            const data: EventData | false = await holiday({
                ...payload,
                userId: id,
                userType: role,
            });

            if (data) {
                setIsLoading(false);
                return true;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );
    return { addHoliday, isLoading };
}
