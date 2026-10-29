import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getFileBufferReport, getVendorsData, putUpdateVendorStatus } from '../api/vendor';
import { ApiResponseVendor, Vendor, getVendors, updateVendorStatus } from '../types/vendors';

const useVendorData = (payload: getVendors) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, SetRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<Vendor[]>();

    const handleRefresh = () => {
        SetRefresh(prev => !prev);
    };

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: ApiResponseVendor | false = await getVendorsData({
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
        async ({ vendorId, isActive }: updateVendorStatus) => {
            setIsLoading(true);
            const data: {} | false = await putUpdateVendorStatus({
                userId: id,
                userType: role,
                vendorId,
                isActive,
            });
            setIsLoading(false);
            if (data) {
                handleRefresh();
            }
        },
        [id, role]
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
                saveAs(blob, `Vendors.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Vendors.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Vendors.pdf`);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return { isLoading, tableData, count, updateActiveStatus, handleRefresh, downloadReport };
};

export default useVendorData;
