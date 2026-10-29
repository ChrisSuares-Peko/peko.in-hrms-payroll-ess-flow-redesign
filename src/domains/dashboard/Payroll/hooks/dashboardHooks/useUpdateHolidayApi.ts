import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { holidayUpdate } from '../../api/dashBoardIndex';
import { EventData, holidayUpdatePayload } from '../../types/dashboardTypes';

export function useUpdateHoliday() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const updateHoliday = useCallback(
        async (payload: holidayUpdatePayload) => {
            setIsLoading(true);
            const data: EventData | false = await holidayUpdate({
                ...payload,
                start: payload.start,
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
    return { updateHoliday, isLoading };
}
