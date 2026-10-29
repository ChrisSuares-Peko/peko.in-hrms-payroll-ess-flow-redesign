import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    deleteWorkspace,
    getFileBufferReport,
    getWorkspaceData,
    updateWorkspaceStatus,
} from '../api/workpace';
import {
    ApiResponseWorkspace,
    WorkspaceBody,
    WorkspaceID,
    getWorkspace,
    updateWorkspaceStatusPayload,
} from '../types/workspace';

const useWorkspaceData = ({ searchText, itemsPerPage, page, sort, sortField }: getWorkspace) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, SetRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<WorkspaceBody[]>();

    const handleRefresh = () => {
        SetRefresh(prev => !prev);
    };

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: ApiResponseWorkspace | false = await getWorkspaceData({
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
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, itemsPerPage, page, role, searchText, sort, refresh, sortField]);

    const updateActiveStatus = useCallback(
        async ({ workspaceId, status }: updateWorkspaceStatusPayload) => {
            setIsLoading(true);
            const data: {} | false = await updateWorkspaceStatus({
                userId: id,
                userType: role,
                workspaceId,
                status,
            });
            setIsLoading(false);
            if (data) {
                handleRefresh();
            }
        },
        [id, role]
    );

    const deleteWorkspaceData = useCallback(
        async (data: WorkspaceID) => {
            setIsLoading(true);
            const response: {} | false = await deleteWorkspace({
                userId: id,
                userType: role,
                ...data,
            });
            if (response) {
                handleRefresh();
                dispatch(
                    showToast({ description: 'Workspace deleted successfully', variant: 'success' })
                );
            }
            setIsLoading(false);
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
            itemsPerPage,
            page,
            sort,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Workspace.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Workspace.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Workspace.pdf`);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return {
        isLoading,
        tableData,
        count,
        updateActiveStatus,
        handleRefresh,
        deleteWorkspaceData,
        downloadReport,
    };
};

export default useWorkspaceData;
