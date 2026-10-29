import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmailDomains } from '../api/index';
import { EmailDomainListResponse, EmailDomainTableData } from '../types/types';

export default function useEmailDomainApi(searchText: string, page: number, itemsPerPage: number) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [tableData, setTableData] = useState<EmailDomainTableData>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const getEmailDomainList = useCallback(async () => {
        setIsLoading(true);
        const data: EmailDomainListResponse | false = await getEmailDomains({
            userId: id,
            userType: role,
            searchText,
            page,
            itemsPerPage,
        });
        if (data) {
            const subscriptionData = data as EmailDomainListResponse;
            const arr = subscriptionData?.data?.map(software => ({
                id: software.id ?? '',
                name: software.name ?? '',
                offersText: software.offersText ?? '',
                status: software.status ?? '',
                createdAt: software.createdAt ?? '',
                updatedAt: software.updatedAt ?? '',
                image: software.image ?? '',
            }));
            setTableData(arr);
            setCount(subscriptionData.recordsTotal);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, searchText, page, itemsPerPage]);

    useEffect(() => {
        getEmailDomainList();
    }, [getEmailDomainList]);

    return { data: tableData, isLoading, count };
}
