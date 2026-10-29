import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getDocumentRequests } from '../../api/documentRequestApi';
import type { DocumentRequestRecord } from '../../components/Employees/DocumentRequestsTab';

const toStatusLabel = (status?: string): DocumentRequestRecord['status'] => {
    switch (status) {
        case 'completed':
            return 'Completed';
        case 'rejected':
            return 'Rejected';
        case 'in-progress':
            return 'In Progress';
        default:
            return 'Pending';
    }
};

export const useGetDocumentRequestsApi = (
    page: number,
    limit: number,
    searchText: string,
    reloadTable: boolean
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [requestData, setRequestData] = useState<DocumentRequestRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(0);
    const [pendingCount, setPendingCount] = useState<number>(0);

    const getRequests = useCallback(async () => {
        setIsLoading(true);
        const data = await getDocumentRequests({ userType: role, userId: id, page, limit, searchText });
        if (data) {
            const arr: DocumentRequestRecord[] = (data?.records ?? []).map((item, index) => ({
                key: item?.id ?? String(index),
                employeeName: item?.employee?.fullName ?? '',
                employeeId: item?.employee?.employeeId ?? '',
                documentType: item?.documentType,
                purpose: item?.purpose,
                date: item?.createdAt,
                status: toStatusLabel(item?.status),
                requestId: item?.id,
            }));
            setRequestData(arr);
            setCount(data?.total ?? 0);
            setPendingCount(data?.pendingCount ?? 0);
        }
        setIsLoading(false);
    }, [id, role, page, limit, searchText]);

    useEffect(() => {
        getRequests();
    }, [getRequests, reloadTable]);

    return { requestData, requestLoading: isLoading, requestTotal: count, pendingCount };
};
