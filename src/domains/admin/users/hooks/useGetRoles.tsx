import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer, SuccessGenericResponse } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteRole, getFileBufferReportRoles, getRoles, putUpdateRolesStatus } from '../api';
import { activeResponse, updateStatus } from '../types/corporateUserTypes';
import { Role, RolesResponse, getSystemUsers } from '../types/systemUserTypes';

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
    const dispatch = useAppDispatch();
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

    const deleteRoleById = useCallback(
        async (serviceId: number) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<activeResponse> | false = await deleteRole({
                userId: id,
                userType: role,
                id: serviceId,
            });
            if (data) {
                if (data.status) {
                    dispatch(
                        showToast({
                            description: data.message,
                            variant: 'success',
                        })
                    );
                    setRefresh(true);
                }
            }
            setIsLoading(false);
        },
        [id, role, dispatch]
    );

    const updateActiveStatus = useCallback(
        async ({ corporateId, isActive }: updateStatus) => {
            setIsLoading(true);
            const dataResp: activeResponse | false = await putUpdateRolesStatus({
                userId: id,
                userType: role,
                corporateId,
                isActive,
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
                saveAs(blob, `Roles.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Roles.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Roles.pdf`);
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
        deleteRoleById,
        setRefresh,
        updateActiveStatus,
        downloadReport,
    };
};
