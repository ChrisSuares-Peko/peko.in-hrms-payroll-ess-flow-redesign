import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllQuoteRequests, getFileBufferReport, updateQuoteRequestStatus } from '../api/quoteRequests';
import {
    GetQuoteRequestsParams,
    QuoteRequest,
    QuoteRequestListResponse,
    UpdateQuoteStatusPayload,
} from '../types/quoteRequests';

const useQuoteRequests = ({
    searchText,
    itemsPerPage,
    page,
    sort,
    sortField,
    status,
    insuranceType,
}: GetQuoteRequestsParams) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [count, setCount] = useState<number>(0);
    const [tableData, setTableData] = useState<QuoteRequest[]>([]);

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: QuoteRequestListResponse | false = await getAllQuoteRequests({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
            sortField,
            status,
            insuranceType,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role, searchText, itemsPerPage, page, sort, sortField, status, insuranceType]);

    const updateStatus = useCallback(
        async ({ id: requestId, status: newStatus, remarks }: UpdateQuoteStatusPayload) => {
            setUpdating(true);
            const res: any = await updateQuoteRequestStatus({
                userId: id,
                userType: role,
                id: requestId,
                status: newStatus,
                remarks,
            });
            setUpdating(false);
            if (res && res.status) {
                dispatch(
                    showToast({
                        description: 'Quote request updated successfully',
                        variant: 'success',
                    })
                );
                setRefresh(true);
                return true;
            }
            dispatch(
                showToast({
                    description: 'Failed to update quote request',
                    variant: 'error',
                })
            );
            return false;
        },
        [id, role, dispatch]
    );

    const downloadReport = async (type: string) => {
        const data: CommonFileBuffer | false = await getFileBufferReport({
            userId: id,
            userType: role,
            type,
            searchText,
            itemsPerPage,
            page,
            sort,
            sortField,
            status,
            insuranceType,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);
            const blob = new Blob([arrayBuffer], { type: data.fileType });
            if (type === 'excel') {
                saveAs(blob, `Quote-Requests.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Quote-Requests.csv`);
            }
        }
    };

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return { isLoading, updating, tableData, count, updateStatus, downloadReport, setRefresh };
};

export default useQuoteRequests;
