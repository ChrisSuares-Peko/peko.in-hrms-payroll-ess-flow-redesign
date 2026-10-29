/* eslint-disable no-nested-ternary */

import { useState, useCallback, useEffect } from 'react';

import { Grid } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import { fetchDashboardData } from '../../api/dashboard';
import { DashboardListingResponse } from '../../types/dash';

export const useGetDashDataApi = (reloadTable?: boolean) => {
    const screens = Grid.useBreakpoint();

    function chunkArray(array: any[], chunkSize: number) {
        const result = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            const chunk = array.slice(i, i + chunkSize);
            result.push(chunk);
        }
        return result;
    }
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [docListData, setDocListData] = useState<any[][]>([]); // Updated to handle an array of arrays
    const [isLoading, setIsLoading] = useState(true);
    const [totalDoc, setTotalDoc] = useState<number | string | undefined>();
    const [totalSubs, setTotalSubs] = useState<number | string | undefined>();
    const [totalSubSpent, setTotalSubSpent] = useState<number | string | undefined>();
    const [totalAssetsAndFleets, setTotalAssetsAndFleets] = useState<number | string | undefined>();

    const getDocList = useCallback(async () => {
        setIsLoading(true);
        const data: DashboardListingResponse | false = await fetchDashboardData({
            userId: id,
            userType: role,
        });

        if (data) {
            const reminders =
                data?.remindersList?.map(item => ({
                    title: item.title ?? '',
                    subTitle: item.subTitle ?? '',
                    date: item.date ?? '',
                    icon: item?.icon ?? '',
                    type: item.type ?? '',
                })) ?? [];
            const chunkSize = screens.xxl
                ? 5
                : screens.xl
                  ? 4
                  : screens.lg
                    ? 3
                    : screens.md
                      ? 3
                      : screens.sm
                        ? 2
                        : 2;
            const chunkedData = chunkArray(reminders, chunkSize);

            setTotalDoc(data.totalDocuments);
            setTotalSubs(data.totalSubscriptions);
            setTotalSubSpent(data.totalSubscriptionsSpent);
            setTotalAssetsAndFleets(data.totalAssetsAndFleets);
            setDocListData(chunkedData);
        }
        setIsLoading(false);
    }, [id, role, screens]);

    useEffect(() => {
        getDocList();
    }, [getDocList, reloadTable]);

    return {
        tableDatas: docListData,
        totalDoc,
        tableLoading: isLoading,
        totalSubs,
        totalSubSpent,
        totalAssetsAndFleets,
    };
};
