import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getCorporateTaxData, getFileBufferReport, updateStatus } from '../api/corporateTax';
import { taxResponse, Records, taxPayload } from '../types/corporateTaxTypes';

export default function useGetCorporateTax({
    searchText,
    pageSize,
    page,
    sort,
    sortField,
    from,
    to,
}: taxPayload) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<Records[]>();
    const dispatch = useAppDispatch();

    const getTax = useCallback(async () => {
        setIsLoading(true);
        const data: taxResponse | false = await getCorporateTaxData({
            userId: id,
            userType: role,
            searchText,
            pageSize,
            page,
            sort,
            sortField,
            from,
            to,
        });

        if (data) {
            setTableData(data.rows);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, page, pageSize, role, searchText, sort, sortField, from, to]);

    const statusUpdate = useCallback(
        async (status?: string, registrationId?: number, remarks?: string) => {
            setIsLoading(true);
            const data: {} | false = await updateStatus({
                userId: id,
                userType: role,
                status,
                remarks,
                registrationId,
            });
            if (data) {
                dispatch(
                    showToast({
                        description: 'Status updated successfully',
                        variant: 'success',
                    })
                );
                setRefresh(true);
                return true;
            }

            setIsLoading(false);
            return false;
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
            pageSize,
            page,
            sort,
            sortField,
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
                saveAs(blob, `Corporate Tax Registration.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Corporate Tax Registration.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Corporate Tax Registration.pdf`);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getTax();
    }, [getTax, refresh]);

    return { tableData, loading: isLoading, count, setRefresh, statusUpdate, downloadReport };
}
