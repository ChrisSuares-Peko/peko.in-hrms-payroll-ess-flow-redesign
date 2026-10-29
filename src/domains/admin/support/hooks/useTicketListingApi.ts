import { useState, useCallback, useEffect } from 'react';

import moment from 'moment';

import { CommonFileBuffer, DownloadType } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { formattedDateOnly } from '@utils/dateFormat';

import useFileDownloader from './useFileDownloader';
import { getFileBufferReport, ticketListing } from '../api/index';
import { ticketListingTableData, ticketListingResponse } from '../types/type';

type FileType = 'xlsx' | 'pdf' | 'csv';
export const useTicketListingApi = (
    fromDate: string,
    toDate: string,
    page: number,
    status: any
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [tableDetails, setTableDetails] = useState<ticketListingTableData[]>([]);
    const [count, setCount] = useState<number>();

    const [isLoading, setIsLoading] = useState(true);
    const [isReportLoading, setIsReportLoading] = useState(false);

    const { handleDownload } = useFileDownloader();

    const calculateOverdue = (item: any) => {
        if (item.status === 'PENDING') {
            const createdDate = moment(item.createdAt);
            const today = moment();
            const daysDifference = today.diff(createdDate, 'days');
            return daysDifference;
        }
        return '-';
    };

    const getTicketList = useCallback(async () => {
        const data: ticketListingResponse | false = await ticketListing({
            userId: id,
            userType: role,
            fromDate,
            toDate,
            page,
            status,
        });

        if (data) {
            const listingData = data;

            const arr = listingData?.data?.map(item => ({
                date: item.createdAt ?? '',
                issueDetails: item.description ?? '',
                resolvedDate:
                    item.status === 'PENDING' ? '-' : formattedDateOnly(new Date(item.updatedAt)),
                id: item.id ?? '',
                module: item.module ?? '',
                overdue: calculateOverdue(item),
                updates: item.chats
                    ? (() => {
                          const lastNonAdminMessageIndex = item.chats
                              .slice(0)
                              .reverse()
                              .findIndex(chatItem => chatItem.admin);

                          const countIndex =
                              lastNonAdminMessageIndex >= 0
                                  ? item.chats.length - lastNonAdminMessageIndex - 1
                                  : 0;
                          return item.chats
                              .slice(countIndex)
                              .reduce(
                                  (acc, currentChat) => (!currentChat.admin ? acc + 1 : acc),
                                  0
                              );
                      })()
                    : 0,
                status: item.status ?? '',
                issueType: item.issueType ?? '',
                view: 'view',
                merchantName: item.corporateUser?.credential?.name,
                description: item.description,
                ticketId: item.ticketId,
            }));

            setTableDetails(arr);
            setCount(listingData.recordsTotal);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [fromDate, id, role, toDate, page, status]);
    useEffect(() => {
        getTicketList();
    }, [getTicketList]);

    const handleDelete = async (ticketId: number) => {
        // Call the API to delete the item
        // await deleteTicketApi(id); // Replace with your actual API call

        const updatedData = tableDetails.filter(item => item.id !== ticketId);
        setTableDetails(updatedData);
    };

    const downloadReport = async (type: DownloadType) => {
        setIsReportLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReport({
            userId: id,
            userType: role,
            type,
            from: fromDate,
            to: toDate,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);
            const fileName = 'Need Help';
            const fileType: FileType = type === 'excel' ? 'xlsx' : type;
            handleDownload(arrayBuffer, fileName, fileType);
        }
        setIsReportLoading(false);
    };
    return {
        data: tableDetails,
        isLoading,
        count,
        isReportLoading,
        handleDelete,
        getTicketList,
        downloadReport,
    };
};
