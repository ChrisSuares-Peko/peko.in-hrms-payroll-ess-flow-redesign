import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listCompanyDoc } from '../../api/companyDoc';
import { CompanyDocListingResponse } from '../../types/companyDoc';

const initialDocs = [
    'Trade Licenses',
    'MOA & AOA',
    'Immigration Establishment Cards',
    'Ministry of Labour Establishment Cards',
];

export const useGetAllCompanyDocApi = (
    page: number,
    itemsPerPage: number,
    reloadTable: boolean,
    searchText: string
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [docListData, setDocListData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const getCompanyDocList = useCallback(async () => {
        setIsLoading(true);
        setDocListData([]);
        const data: CompanyDocListingResponse | false = await listCompanyDoc({
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

            // Only add initial documents if on the first page and no search text
            if (page === 1 && !searchText) {
                const existingDocNames = new Set(arr.map(item => item.documentName));
                const missingDocs = initialDocs.filter(docName => !existingDocNames.has(docName));

                if (missingDocs.length > 0) {
                    const initialDocsList = missingDocs.map(docName => ({
                        documentName: docName,
                        documentNumber: '',
                        documentType: '',
                        issueDate: '',
                        expireDate: '',
                        status: '',
                        actions: '',
                        id: '',
                        document: '',
                        documentAvailability: '',
                    }));

                    setDocListData([...initialDocsList, ...arr]);
                } else {
                    setDocListData(arr);
                }
            } else {
                setDocListData(arr);
            }

            setCount(data.totalData);
        }

        setIsLoading(false);
    }, [id, role, itemsPerPage, page, searchText]);

    useEffect(() => {
        getCompanyDocList();
    }, [getCompanyDocList, reloadTable]);

    return {
        tableDatas: docListData,
        orderCount: count,
        tableLoading: isLoading,
    };
};
