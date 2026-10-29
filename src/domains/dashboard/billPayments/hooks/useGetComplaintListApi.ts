import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { complaintListing } from '../api/index';

export default function useComplaintListApi({
    searchText,
    category,
    sort,
    page,
    itemsPerPage,
    filter,
    from,
    to,
    sortField,
}: any) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [complaintDta, setComplaintData] = useState<any>([]);
    const [count, setCount] = useState<number>(1);
    const getComplaintList = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await complaintListing({
            userId: id,
            userType: role,
            from,
            to,
            searchText,
            sort,
            page,
            itemsPerPage,
            filter,
            sortField,
        });

        if (data) {
            setComplaintData(data.data);
            setCount(data.recordsTotal);

            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, from, to, searchText, sort, page, itemsPerPage, filter, sortField]);
    useEffect(() => {
        getComplaintList();
    }, [getComplaintList]);

    return { isLoading, complaintDta, count };
}
