import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { docList } from '../../api/docAndAssetsApi/index';
import { DocumentsListingResponse, documentTable } from '../../types/docAndAssetsTypes/index';

export const useGetEmployeeDocumentsApi = (
    page: number,
    limit: number,
    year: number,
    month: number | string,
    searchText: string,
    employee: string,
    reloadTable: boolean
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [documentData, setDocumentData] = useState<documentTable[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(0);
    const getDocData = useCallback(async () => {
        setIsLoading(true);
        const data: DocumentsListingResponse | false = await docList({
            userId: id,
            userType: role,
            limit,
            page,
            year,
            month,
            searchText,
            employee,
        });
        if (data) {
            const arr = data?.documents?.map(item => ({
                dateAdded: new Date(item?.createdAt).toISOString().split('T')[0] ?? '',
                employeeName: item?.fullName ?? '',
                documentName: item?.name ?? '',
                // expiryDate: item?.expiryDate ?? '',.
                expiryDate: item?.expiryDate
                    ? new Date(item?.expiryDate).toISOString().split('T')[0]
                    : 'N/A',
                action: '',
                docuementId: item?._id ?? '',
                employeeId: item?.employeeId ?? '',
                url: item?.url ?? '',
                holderName: item?.holderName ?? '',
            }));

            setDocumentData(arr);
            setCount(data?.total);
        }
        setIsLoading(false);
    }, [id, role, limit, page, year, month, searchText, employee]);

    useEffect(() => {
        getDocData();
    }, [getDocData, reloadTable]);

    return { tableDatas: documentData, tableLoading: isLoading, total: count };
};
