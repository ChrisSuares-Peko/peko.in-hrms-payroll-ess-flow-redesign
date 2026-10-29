import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { GetForm24Forms } from '../../api/reports/form24';

export interface Form24TableRow {
    key: string;
    quarter: string;
    year: string;
    fileName: string;
    fileUrl?: string;
    updatedAt: string;
    status: 'Completed' | 'Not Uploaded';
}

export default function useGetAllForm24qs(year?: string, search?: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [form24List, setForm24List] = useState<Form24TableRow[]>([]);

    const GetForm24Data = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await GetForm24Forms({
                userId: id,
                userType: role,
                year,
                search,
            });

            console.log('Response from GetForm24Data:', response?.data);

            const tableData: Form24TableRow[] = (response ?? []).map((item: any) => ({
                key: item._id,
                quarter: item.quarter || '-',
                year: item.data?.financialYear || '-',
                fileName: item.file ? item.file.split('/').pop() : '-',
                fileUrl: item.file,
                updatedAt: item.updatedAt || '-',
                status: item.file ? 'Completed' : 'Not Uploaded',
            }));

            setForm24List(tableData);
        } catch (error) {
            dispatch(
                showToast({
                    description: 'Failed to fetch Form 24Q list.',
                    variant: 'error',
                })
            );
        } finally {
            setIsLoading(false);
        }
    }, [dispatch, id, role, year, search]);

    useEffect(() => {
        GetForm24Data();
    }, [GetForm24Data]);

    return { GetForm24Data, form24List, isLoading };
}

