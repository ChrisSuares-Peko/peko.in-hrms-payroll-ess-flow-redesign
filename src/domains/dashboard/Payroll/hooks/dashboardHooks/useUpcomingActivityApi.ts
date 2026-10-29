import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { calendarActivities, upcomingActivities } from '../../api/dashBoardIndex';
import {
    calendarActivitiesResponse,
    calendarActivitiesType,
    upcoming,
    upcomingActivitiesResponse,
} from '../../types/dashboardTypes';

export function useUpcomingActivityApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [details, setDetails] = useState<upcoming[]>([]);
    const [calendarData, setCalendarData] = useState<calendarActivitiesType[]>([]);
    const [refresh, setRefresh] = useState<boolean>(false);
    const activities = useCallback(async () => {
        const data: upcomingActivitiesResponse | false = await upcomingActivities({
            userId: id,
            userType: role,
        });
        if (data) {
            const activityData = data.upcomingActivities as upcoming[];
            setDetails(activityData);
        }
        setRefresh(false);
    }, [id, role]);
    const CalendarActivities = useCallback(async () => {
        const data: calendarActivitiesResponse | false = await calendarActivities({
            userId: id,
            userType: role,
        });
        if (data) {
            const activityData = data.calendarActivities as calendarActivitiesType[];
            setCalendarData(activityData);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        activities();
        CalendarActivities();
    }, [CalendarActivities, activities, refresh]);

    return { isLoading, data: details, calendarData, setRefresh };
}
