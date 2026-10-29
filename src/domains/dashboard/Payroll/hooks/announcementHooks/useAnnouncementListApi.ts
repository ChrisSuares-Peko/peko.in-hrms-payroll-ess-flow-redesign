import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAnnouncementsAPI } from '../../api/announcementApi/index';
import { IAnnouncementData } from '../../types/announcementTypes';
import { formattedDate } from '../../utils/general/formatter';

export default function GetAnnouncementsList(
    page: number,
    limit: number,
    search: string,
    year: number,
    month: number | string
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [announcementData, setAnnouncementData] = useState<any>();
    const [count, setCount] = useState<number>();
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);

    const getAnnouncementsHandler = useCallback(async () => {
        setIsLoading(true)
        const data: IAnnouncementData | false = await getAnnouncementsAPI({
            userId: id,
            userType: role,
            page,
            limit,
            search,
            year,
            month,
        });
        if (data) {
            const res = data;
            const arr = res?.rows?.map((item, index) => ({
                key: index + 1,
                date: formattedDate(item.createdAt),
                subject: item.subject,
                status: item.status === 'MAILED' ? 'Mailed' : '',
                excludedEmployees: item.excludedEmployees,
                details: item.details,
                id: item.id,
            }));

            setAnnouncementData(arr);
            setCount(res.count);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, limit, month, page, role, search, year]);

    useEffect(() => {
        getAnnouncementsHandler();
    }, [getAnnouncementsHandler, refresh]);
    return { announcementData, count, isLoading, setRefresh };
}
