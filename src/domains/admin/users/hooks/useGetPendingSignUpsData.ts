import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getFileBufferReportPendingSignUps, getPendingSignUpsData, updateDocument } from '../api';
import {
    ApiResponse,
    Data,
    getCorporateUsers,
    PendingSignupData,
} from '../types/corporateUserTypes';

const useGetPendingSignUpsData = ({
    searchText,
    itemsPerPage,
    page,
    partnerId,
    sort,
    sortField,
    from,
    to,
    status,
}: getCorporateUsers) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, SetRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<Data[]>();
    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: ApiResponse | false = await getPendingSignUpsData({
            userId: id,
            userType: role,
            itemsPerPage,
            page,
            searchText,
            partnerId,
            sort,
            sortField,
            from,
            to,
            status,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        SetRefresh(false);
        setIsLoading(false);
    }, [id, itemsPerPage, page, partnerId, role, searchText, sort, sortField, from, to, status]);

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReportPendingSignUps({
            userId: id,
            userType: role,
            type,
            searchText,
            partnerId,
            page,
            itemsPerPage,
            status,
            from,
            to,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Pending Sign ups.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Pending Sign ups.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Pending Sign ups.pdf`);
            }
        }
        setIsLoading(false);
    };
    const updatePendingsignup = useCallback(
        async (payloadData: PendingSignupData) => {
            setIsLoading(true);
            const data: ApiResponse | false = await updateDocument({
                userId: id,
                userType: role,
                ...payloadData,
            });
            if (data) {
                SetRefresh(true);
                return true;
            }
            return false;
        },
        [id, role]
    );
    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return {
        isLoading,
        tableData,
        count,
        downloadReport,
        updatePendingsignup,
    };
};

export default useGetPendingSignUpsData;
