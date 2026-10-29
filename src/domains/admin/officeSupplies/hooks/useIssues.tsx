import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllIssues, getFileBufferReportIssues } from '../api/issues';
import { AdminIssueRow, AdminIssuesListResponse } from '../types/adminOndcIssue';

type IssuesFilters = {
    page: number;
    itemsPerPage: number;
    searchText: string;
    from: string;
    to: string;
    sort: string;
    sortField: string;
    status?: string;
    category?: string;
    needsAttention?: boolean;
};

/** Issues tab — list + export. */
const useIssues = (payload: IssuesFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<AdminIssueRow[]>();

    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: AdminIssuesListResponse | false = await getAllIssues({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setIsLoading(false);
    }, [id, payload, role]);

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReportIssues({
            userId: id,
            userType: role,
            type,
            ...payload,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);
            const blob = new Blob([arrayBuffer], { type: data.fileType });
            if (type === 'excel') saveAs(blob, `Issues.xlsx`);
            else if (type === 'csv') saveAs(blob, `Issues.csv`);
            else if (type === 'pdf') saveAs(blob, `Issues.pdf`);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getAllTableData();
    }, [getAllTableData]);

    return { isLoading, tableData, count, getAllTableData, downloadReport };
};

export default useIssues;
