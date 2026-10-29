import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllKybDetails } from '../../api/vendorPayout';
import { CorporateRecordsResponse, GetAllKybDetailsPayload } from '../../types/vendorPayout';

export default function useGetAllKybApi({
    sort,
    searchText,
    itemsPerPage,
    pageSize,
    page,
    sortField,
    from,
    to,
}: GetAllKybDetailsPayload) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<any[]>();

    const getKybs = useCallback(async () => {
        setIsLoading(true);
        const data: CorporateRecordsResponse | false = await getAllKybDetails({
            userId: id,
            userType: role,
            itemsPerPage,
            pageSize,
            page,
            searchText,
            sort,
            sortField,
            to,
            from,
        });

        if (data) {
            setTableData(data.rows);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role, itemsPerPage, pageSize, page, searchText, sort, sortField, to, from]);

    useEffect(() => {
        getKybs();
    }, [getKybs, refresh]);

    return { tableData, loading: isLoading, count, setRefresh };
}
