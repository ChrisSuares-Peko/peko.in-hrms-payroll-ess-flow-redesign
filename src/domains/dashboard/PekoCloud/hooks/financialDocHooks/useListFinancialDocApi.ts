import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listFinancialDoc } from '../../api/financialDoc';
import { FinancialDocListingResponse } from '../../types/financials/index';

export const useGetAllFinancialDocApi = (
    page: number,
    itemsPerPage: number,
    reloadTable: boolean,
    searchText: string
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [docListData, setDocListData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();
    const getDocList = useCallback(async () => {
        setIsLoading(true);
        const data: FinancialDocListingResponse | false = await listFinancialDoc({
            userId: id,
            userType: role,
            itemsPerPage,
            page,
            searchText,
        });

        if (data) {
            const arr = data?.result?.map(item => {
                const currentDate = new Date();
                const issueDate = new Date(item?.issueDate);
                const expireDate = new Date(item.expireDate);
                let status = '';

                if (currentDate > expireDate) {
                    status = 'Expired';
                } else if (currentDate < issueDate) {
                    status = 'Upcoming';
                } else {
                    status = 'Active';
                }
                return {
                    documentName: item.documentName ?? '',
                    documentNumber: item.documentNumber ?? '',
                    documentType: item.documentType ?? '',
                    issueDate: item?.issueDate ?? '',
                    expireDate: item.expireDate ?? '',
                    status,
                    actions: '',
                    id: item?.id ?? '',
                    document: item.document ?? '',
                    documentAvailability: item.document ? 'Available' : 'NA',
                };
            });
            setCount(data.totalData);
            setDocListData(arr);
        }
        setIsLoading(false);
    }, [id, role, itemsPerPage, page, searchText]);
    useEffect(() => {
        getDocList();
    }, [getDocList, reloadTable]);

    return {
        tableDatas: docListData,
        orderCount: count,
        tableLoading: isLoading,
    };
};
