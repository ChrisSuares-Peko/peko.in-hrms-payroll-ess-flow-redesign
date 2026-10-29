import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';
import { useDispatch } from 'react-redux';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    deletePackage,
    getFileBufferReport,
    getPackagesData,
    putUpdatePackageStatus,
} from '../api/package';
import {
    ApiResponsePackage,
    PackageFilters,
    PackageID,
    Packages,
    updatePackageStatus,
} from '../types/package';

const usePackage = (payload: PackageFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, SetRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<Packages[]>();
    const dispatch = useDispatch();

    const handleRefresh = () => {
        SetRefresh(prev => !prev);
    };

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: ApiResponsePackage | false = await getPackagesData({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, role, payload, refresh]);

    const updateActiveStatus = useCallback(
        async ({ packageId, status }: updatePackageStatus) => {
            setIsLoading(true);
            const data: {} | false = await putUpdatePackageStatus({
                userId: id,
                userType: role,
                packageId,
                status,
            });
            setIsLoading(false);
            if (data) {
                handleRefresh();
            }
        },
        [id, role]
    );

    const deletePackageDetails = useCallback(
        async (vendorUpdatedData: PackageID) => {
            setIsLoading(true);
            const response: {} | false = await deletePackage({
                userId: id,
                userType: role,
                ...vendorUpdatedData,
            });
            setIsLoading(false);
            if (response) {
                dispatch(
                    showToast({
                        description: `Package deleted successfully`,
                        variant: 'success',
                    })
                );
                handleRefresh();
            }
            return response;
        },
        [id, role, dispatch]
    );

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReport({
            userId: id,
            userType: role,
            type,
            ...payload,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Packages.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Packages.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Packages.pdf`);
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
        deletePackageDetails,
        downloadReport,
    };
};

export default usePackage;
