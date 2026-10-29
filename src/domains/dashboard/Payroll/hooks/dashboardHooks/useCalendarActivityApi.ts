import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { calendarActivities } from '../../api/dashBoardIndex';
import { calendarActivitiesType, calendarActivitiesResponse } from '../../types/dashboardTypes';

export function useCalendarActivityApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [details, setDetails] = useState<calendarActivitiesType[]>([]);
    const [refresh, setRefresh] = useState<boolean>(false);
    const CalendarActivities = useCallback(async () => {
        const data: calendarActivitiesResponse | false = await calendarActivities({
            userId: id,
            userType: role,
        });
        if (data) {
            const activityData = data.calendarActivities as calendarActivitiesType[];
            setDetails(activityData);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        CalendarActivities();
    }, [CalendarActivities, refresh]);

    return { isLoading, holidays: details, setRefresh };
}
