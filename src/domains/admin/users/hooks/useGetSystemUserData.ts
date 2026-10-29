import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer, SuccessGenericResponse } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    deleteUser,
    getSystemUserData,
    getFileBufferReportSystem,
    getUpdateSystemUserStatus,
    resentEmail,
} from '../api/index';
import { activeResponse, updateStatus } from '../types/corporateUserTypes';
import { User, getSystemUsers, systemUserResponse } from '../types/systemUserTypes';

export const useGetSystemUserData = ({
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
    const [tableData, setTableData] = useState<User[]>();
    const dispatch = useAppDispatch();
    const getSystemUser = useCallback(async () => {
        setIsLoading(true);
        const data: systemUserResponse | false = await getSystemUserData({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
            sortField,
        });
        if (data) {
            setTableData(data.data.rows);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, itemsPerPage, page, role, searchText, sort, sortField]);

    const deleteUserById = useCallback(
        async (serviceId: number) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<activeResponse> | false = await deleteUser({
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

    const resentEmailById = useCallback(
        async (serviceId: number) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<activeResponse> | false = await resentEmail({
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
            const dataResp: activeResponse | false = await getUpdateSystemUserStatus({
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
        const data: CommonFileBuffer | false = await getFileBufferReportSystem({
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
                saveAs(blob, `System Users.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `System Users.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `System Users.pdf`);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getSystemUser();
    }, [getSystemUser, refresh]);

    return {
        isLoading,
        tableData,
        count,
        deleteUserById,
        setRefresh,
        downloadReport,
        resentEmailById,
        updateActiveStatus,
    };
};
