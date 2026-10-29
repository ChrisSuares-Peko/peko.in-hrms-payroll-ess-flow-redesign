import { useState, useCallback, useEffect } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getFileBufferReport, walletReportListingApi } from '../api/walletReport';
import { Reports, walletListingResponse } from '../types/WalletReportTypes';

export const useWalletReportsApi = (
    fromDate: string,
    toDate: string,
    page: number,
    sort: 'ASC' | 'DESC',
    searchText: string,
    corporateId?: string,
    sortField?: string
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [tableDetails, setTableDetails] = useState<Reports[]>();
    const [count, setCount] = useState<number>();

    const [isLoading, setIsLoading] = useState(true);

    const getWalletReportList = useCallback(async () => {
        const data: walletListingResponse | false = await walletReportListingApi({
            userId: id,
            userType: role,
            sortField,
            fromDate,
            toDate,
            page,
            sort,
            corporateId,
            searchText,
        });

        if (data) {
            const listingData = data;
            // const arr = listingData?.data?.map(item => ({
            //     id: item.id ?? '',
            //     corporateName: item.credential.name ?? '',
            //     corporateId: item.credential.username ?? '-',
            //     corporateTxnId: item.corporateTxnId ?? '',
            //     transactionDate: item.transactionDate ?? '',
            //     transactionType: item.transactionType ?? '',
            //     debitAmount: item.debitAmount ?? '',
            //     creditAmount: item.creditAmount ?? '',
            //     status: item.status ?? '-',
            // }));
            setTableDetails(listingData.data);
            setCount(listingData.recordsTotal);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [fromDate, id, role, toDate, page, corporateId, searchText, sort, sortField]);
    useEffect(() => {
        getWalletReportList();
    }, [getWalletReportList]);

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReport({
            userId: id,
            userType: role,
            type,
            from: fromDate,
            page,
            itemsPerPage: 10,
            to: toDate,
            sort,
            id: corporateId,
            searchText,
            sortField,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Wallet Report.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Wallet Report.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Wallet Report.pdf`);
            }
        }
        setIsLoading(false);
    };

    return { data: tableDetails, isLoading, count, getWalletReportList, downloadReport };
};
