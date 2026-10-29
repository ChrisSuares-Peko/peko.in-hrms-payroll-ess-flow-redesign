import { useCallback, useEffect, useState } from 'react';

import saveAs from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllPaymentLinks, getFileBufferReport } from '../api';

export default function useGetPaymentLinks({
    searchText,
    itemsPerPage,
    page,
    sort,
    pageSize,
    from,
    to,
}: any) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [paymentLinksList, setPaymentLinksList] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState<string | number>();

    const [isLoading, setIsLoading] = useState(false);

    const getPaymentLinksList = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getAllPaymentLinks({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
            from,
            to,
        });
        setRefresh(false);
        setIsLoading(false);
        if (data.data && data.data.length) {
            const tableFormatedDate = data.data.map((link: any) => {
                const { sentPayload } = link;
                return {
                    createdAt: link.createdAt ?? '',
                    customerName: sentPayload.full_name ?? '',
                    amount: link?.amount ?? '',
                    currency: sentPayload?.currency ?? '',
                    expiryDate: sentPayload?.expires_at ?? '',
                    status: link.status ?? '',
                    client_url: link.client_url ?? '',
                    email: sentPayload.email ?? '',
                    invoiceId: link.invoiceId ?? '',
                };
            });
            setPaymentLinksList(tableFormatedDate);
            setTotalCount(data.recordsTotal);
        }
    }, [id, itemsPerPage, page, role, searchText, sort, from, to]);
    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReport({
            userId: id,
            userType: role,
            type,
            searchText,
            pageSize,
            page,
            to,
            from,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Payment Link.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Payment Link.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Payment Link.pdf`);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getPaymentLinksList();
    }, [getPaymentLinksList, refresh]);

    return {
        isLoading,
        paymentLinksList,
        getPaymentLinksList,
        totalCount,
        setRefresh,
        downloadReport,
    };
}
