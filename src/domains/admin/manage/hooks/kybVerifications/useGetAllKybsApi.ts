import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllVerificationData, updateKybVerificationStatus } from '../../api/kybVerification';

export default function useGetAllKybsApi({ searchText, itemsPerPage, page, sort, sortField }: any) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<any[]>();
    const handleRefresh = () => {
        setRefresh(prev => !prev);
    };
    const getKybVerifications = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getAllVerificationData({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
        });

        if (data) {
            setTableData(data.rows);
            setCount(data.count);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, itemsPerPage, page, role, searchText, sort]);

    const updateStatusKyb = useCallback(
        async (payload: any) => {
            setIsLoading(true);
            const data: any | false = await updateKybVerificationStatus({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                setRefresh(true);
            }
            setIsLoading(false);
        },
        [id, role]
    );

    useEffect(() => {
        getKybVerifications();
    }, [getKybVerifications, refresh]);

    return { tableData, loading: isLoading, count, setRefresh, updateStatusKyb, handleRefresh };
}
