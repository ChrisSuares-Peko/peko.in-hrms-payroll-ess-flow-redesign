import { useState, useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { deleteHoliday } from '../../api/dashBoardIndex';
import { holidayDeleteResponse } from '../../types/dashboardTypes';

interface useHolidayApiProps {
    handleCancel?: () => void;
}
export const useDeleteHolidayApi = ({ handleCancel }: useHolidayApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setIsLoading] = useState(false);

    const deleteHolidayData = useCallback(
        async (holidayId: string) => {
            setIsLoading(true);

            const data: holidayDeleteResponse | false = await deleteHoliday({
                userId: id,
                userType: role,
                holidayId,
            });
            setIsLoading(false);
            if (data) {
                handleCancel?.();
                return true;
            }
            return false;
        },
        [handleCancel, id, role]
    );
    return { deleteHolidayData, isLoading };
};
