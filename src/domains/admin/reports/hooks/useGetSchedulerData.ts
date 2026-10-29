import { useState, useCallback, useEffect, useMemo } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllShedulerData, updateSheduler } from '../api/scheduleReport';
import { SchedulerResponse, HandleUpdateBtnType } from '../types/index';

export const useGetShedulerData = () => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [shedulerData, setShedulerData] = useState<SchedulerResponse | false>();
    const [updated, setUpdated] = useState(false);
    const getShedular = useCallback(async () => {
        const data: SchedulerResponse | false = await getAllShedulerData({
            userId: id,
            userType: role,
        });
        if (data) {
            setShedulerData(data);
        }
        setIsLoading(false);
    }, [role, id]);

    const UpdateShedular = useCallback(
        async ({
            email,
            isActive,
            scheduledTime,
            scheduledDay,
            route,
        }: {
            email: string[] | undefined | false;
            isActive: boolean | undefined;
            scheduledTime: string | false | undefined;
            scheduledDay: string | false | undefined;
            route: string; // Remove unused parameter
        }) => {
            const data: string | false = await updateSheduler({
                userId: id,
                userType: role,
                email,
                isActive,
                scheduledTime,
                scheduledDay,
                route,
            });
            if (data) {
                setUpdated(!updated);
                dispatch(
                    showToast({
                        description: data,
                        variant: 'success',
                    })
                );
            }
        },
        [id, role, updated, dispatch]
    );
    const handleUpdateBtn: HandleUpdateBtnType = (
        title,
        emailIds,
        scheduledTime,
        scheduledDay,
        isActive,
        isToggle = false
    ) => {
        const payload = {
            email: emailIds,
            scheduledTime,
            scheduledDay,
            isActive,
            route: '',
            isToggle,
        };
        switch (title) {
            case scheduler.daily.title:
                payload.route = 'dailyReport';
                break;
            case scheduler.weekly.title:
                payload.route = 'weeklyReport';
                break;
            case scheduler.monthly.title:
                payload.route = 'monthlyReport';
                break;
            default:
                break;
        }
        if (!scheduledTime) {
            return dispatch(
                showToast({
                    description: 'Please select a scheduled time',
                    variant: 'warning',
                })
            );
        }
        return UpdateShedular(payload);
    };
    useEffect(() => {
        getShedular();
    }, [getShedular, updated]);
    const scheduler = useMemo(
        () => ({
            daily: {
                title: 'Daily Scheduler',
                email: (shedulerData && shedulerData.dailyReport?.email) || [],
                isActive: (shedulerData && shedulerData.dailyReport?.isActive) || false,
                scheduledTime: (shedulerData && shedulerData.dailyReport?.scheduledTime) || '',
                scheduledDay: '',
            },
            weekly: {
                title: 'Weekly Scheduler',
                email: (shedulerData && shedulerData.weeklyReport?.email) || [],
                isActive: (shedulerData && shedulerData.weeklyReport?.isActive) || false,
                scheduledTime: (shedulerData && shedulerData.weeklyReport?.scheduledTime) || '',
                scheduledDay: (shedulerData && shedulerData.weeklyReport?.scheduledDay) || '',
            },
            monthly: {
                title: 'Monthly Scheduler',
                email: (shedulerData && shedulerData.monthlyReport?.email) || [],
                isActive: (shedulerData && shedulerData.monthlyReport?.isActive) || false,
                scheduledTime: (shedulerData && shedulerData.monthlyReport?.scheduledTime) || '',
                scheduledDay: '',
            },
        }),
        [shedulerData]
    );

    return { isLoading, scheduler, getShedular, handleUpdateBtn };
};
