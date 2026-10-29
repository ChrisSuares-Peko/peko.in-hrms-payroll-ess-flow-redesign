import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    adminUploadBusinessPan,
    getLogisticsCorporateList,
    LogisticsCorporateRecord,
    LogisticsCorporateResponse,
} from '../api/logistics';

export default function useGetLogisticsCorporate({
    page,
    itemsPerPage,
    searchText,
}: {
    page: number;
    itemsPerPage: number;
    searchText?: string;
}) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [tableData, setTableData] = useState<LogisticsCorporateRecord[]>([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const fetchList = useCallback(async () => {
        setLoading(true);
        const data: LogisticsCorporateResponse | false = await getLogisticsCorporateList({
            userType: role,
            userId: id,
            page,
            itemsPerPage,
            searchText,
        });
        if (data) {
            setTableData(data.rows);
            setCount(Number(data.count));
        }
        setRefresh(false);
        setLoading(false);
    }, [role, id, page, itemsPerPage, searchText]);

    const uploadPan = useCallback(
        async (credentialId: number, base64String: string, imageFormat: string) => {
            setIsUploading(true);
            const result = await adminUploadBusinessPan({
                userType: role,
                userId: id,
                credentialId,
                base64String,
                imageFormat,
            });
            setIsUploading(false);
            if (result) {
                dispatch(
                    showToast({
                        description: 'Business PAN uploaded successfully',
                        variant: 'success',
                    })
                );
                setRefresh(true);
                return true;
            }
            dispatch(showToast({ description: 'Failed to upload Business PAN', variant: 'error' }));
            return false;
        },
        [role, id, dispatch]
    );

    useEffect(() => {
        fetchList();
    }, [fetchList, refresh]);

    return { tableData, count, loading, setRefresh, isUploading, uploadPan };
}
