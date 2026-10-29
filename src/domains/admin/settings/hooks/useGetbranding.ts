import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getFileBufferReportRoles, getRoles, putUpdateBrandingStatus } from '../api/branding';
import { activeResponse, brandingResponse, updateStatus } from '../types/branding';
import { getSystemUsers, Role } from '../types/partnerPermission';

export const useGetbranding = ({
    searchText,
    itemsPerPage,
    page,
    sort,
    sortField,
}: getSystemUsers) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<Role[]>();
    const getAllRoles = useCallback(async () => {
        setIsLoading(true);
        const data: brandingResponse | false = await getRoles({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
            sortField,
        });
        if (data) {
            setTableData(data.rows);
            setCount(data.count);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, itemsPerPage, page, role, searchText, sort, sortField]);
    const updateActiveStatus = useCallback(
        async ({ brandingId: recordId, status }: updateStatus) => {
            setIsLoading(true);
            const dataResp: activeResponse | false = await putUpdateBrandingStatus({
                userId: id,
                userType: role,
                id: recordId,
                status,
            });
            if (dataResp) {
                setRefresh(true);
            }
            setRefresh(true);
            setIsLoading(false);
        },
        [id, role]
    );

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReportRoles({
            userId: id,
            userType: role,
            type,
            page,
            itemsPerPage,
            searchText,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Branding.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Branding.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Branding.pdf`);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getAllRoles();
    }, [getAllRoles, refresh]);

    return {
        isLoading,
        tableData,
        count,
        setRefresh,
        downloadReport,
        updateActiveStatus,
    };
};
