import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getAllEmailDomain,
    getFileBufferReport,
    updateActiveStatusEmailDomain,
    deleteEmailDomainApi,
} from '../../api/emailDomain';

export default function useGetAllEmailDomain({
    searchText,
    itemsPerPage,
    page,
    sort,
    sortField,
}: any) {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<any[]>();

    const handleRefresh = () => {
        setRefresh(prev => !prev);
    };

    const getEmailDomainData = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getAllEmailDomain({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
            sortField,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role, searchText, itemsPerPage, page, sort, sortField]);

    const updateStatusEmailDomain = useCallback(
        async (payload: any) => {
            setIsLoading(true);
            const data: any | false = await updateActiveStatusEmailDomain({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                setRefresh(true);
            }
            setIsLoading(false);
        },
        [id, role]
    );

    const deleteEmailDomain = useCallback(
        async (productId: any) => {
            setIsLoading(true);
            const response: any | false = await deleteEmailDomainApi({
                userId: id,
                userType: role,
                productId,
            });

            setIsLoading(false);
            if (response) {
                handleRefresh();
                if (response.status) {
                    dispatch(
                        showToast({
                            description: 'Email or Domain deleted successfully',
                            variant: 'success',
                        })
                    );
                }
            }
            return response;
        },
        [dispatch, id, role]
    );

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReport({
            userId: id,
            userType: role,
            type,
            searchText,
            sort,
            sortField,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Business Emails.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Business Emails.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Business Emails.pdf`);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getEmailDomainData();
    }, [getEmailDomainData, refresh]);

    return {
        tableData,
        loading: isLoading,
        count,
        setRefresh,
        updateStatusEmailDomain,
        downloadReport,
        deleteEmailDomain,
    };
}
