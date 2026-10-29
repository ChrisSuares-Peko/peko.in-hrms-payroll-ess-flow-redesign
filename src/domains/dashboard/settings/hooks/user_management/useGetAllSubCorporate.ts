import { useCallback, useEffect, useState } from 'react';

import { getSubCorporates } from '../../api/userManagement';
import {
    allSubCorporatesResponse,
    SubCorporateQueryParams,
    SubCorporate,
} from '../../types/userManagement';

export default function useGetAllSubCorporate({
    itemsPerPage,
    page,
    status,
    searchText,
    reload,
}: SubCorporateQueryParams) {
    const [tableData, setTableData] = useState<SubCorporate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const getPurchaseHistories = useCallback(async () => {
        setIsLoading(true);
        const data: allSubCorporatesResponse | false = await getSubCorporates({
            itemsPerPage,
            page,
            status,
            searchText,
        });
        if (data) {
            setTableData(data.rows);
            setCount(data.count);
        }
        setIsLoading(false);
    }, [itemsPerPage, page, status, searchText]);

    useEffect(() => {
        getPurchaseHistories();
    }, [getPurchaseHistories, reload]);

    return { data: tableData, isLoading, count };
}
