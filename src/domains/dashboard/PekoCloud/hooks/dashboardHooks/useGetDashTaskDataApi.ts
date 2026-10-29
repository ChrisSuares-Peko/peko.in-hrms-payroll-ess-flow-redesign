import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchTaskToDo } from '../../api/dashboard';
// import { TaskToDoListingResponse } from '../../types/dash';

export const useGetDashToDoApi = (reloadTable?: boolean) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [toDoData, setToDoData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const getDocList = useCallback(async () => {
        setIsLoading(true);
        const data = await fetchTaskToDo({
            userId: id,
            userType: role,
        });

        if (data) {
            const arr = data?.map(
                (item: { title: any; details: any; date: any; icon: any; type: any }) => ({
                    title: item?.title ?? '',
                    subTitle: item?.details ?? '',
                    date: item?.date ?? '',
                    icon: item?.icon ?? '',
                    type: item?.type ?? '',
                    alerts: '',
                    actions: '',
                })
            );

            setToDoData(arr);
        }
        setIsLoading(false);
    }, [id, role]);
    useEffect(() => {
        getDocList();
    }, [getDocList, reloadTable]);

    return {
        toDoData,
        isLoading,
    };
};
