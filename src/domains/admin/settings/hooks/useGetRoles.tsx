import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import {
    getFileBufferReportRoles,
    getRoleById,
    getRoles,
    putUpdateRolesStatus,
    getCashbackData,
} from '../api/partnerPermission';
import {
    activeResponse,
    getSystemUsers,
    Role,
    RolesResponse,
    updateStatus,
} from '../types/partnerPermission';

export const useGetRoles = ({
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
        const data: RolesResponse | false = await getRoles({
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

    // const deleteRoleById = useCallback(
    //     async (serviceId: number) => {
    //         setIsLoading(true);
    //         const data: SuccessGenericResponse<activeResponse> | false = await deleteRole({
    //             userId: id,
    //             userType: role,
    //             id: serviceId,
    //         });
    //         if (data) {
    //             if (data.status) {
    //                 dispatch(
    //                     showToast({
    //                         description: data.message,
    //                         variant: 'success',
    //                     })
    //                 );
    //                 setRefresh(true);
    //             }
    //         }
    //         setIsLoading(false);
    //     },
    //     [id, role, dispatch]
    // );
    const [isFetchingRole, setIsFetchingRole] = useState(false);
    // Fetch the freshest full record for the edit modal, rather than reusing whatever
    // the paginated list happened to hold at fetch time.
    const fetchRoleById = async (recordId: string | number) => {
        setIsFetchingRole(true);
        const data: Role | false = await getRoleById({
            userId: id,
            userType: role,
            id: recordId,
        });
        setIsFetchingRole(false);
        return data;
    };

    const fetchCashbackData = async (recordId: string | number) => {
        setIsLoading(true); // If you have a loading state to manage
        let numericRecordId: any = Number(recordId);
        if (numericRecordId === 0) numericRecordId = '';
        const data: any | false = await getCashbackData({
            recordId: numericRecordId,
        });
        setRefresh(true);
        setIsLoading(false);
        return data;
    };
    const updateActiveStatus = useCallback(
        async ({ id: recordId, status }: updateStatus) => {
            setIsLoading(true);
            const dataResp: activeResponse | false = await putUpdateRolesStatus({
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
                saveAs(blob, `Partner Permissions.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Partner Permissions.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Partner Permissions.pdf`);
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
        // deleteRoleById,
        setRefresh,
        updateActiveStatus,
        downloadReport,
        fetchCashbackData,
        fetchRoleById,
        isFetchingRole,
    };
};
