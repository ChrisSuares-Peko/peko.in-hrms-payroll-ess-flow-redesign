import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { ticketListing } from '../api/index';
import { ticketListingTableData, ticketListingResponse } from '../types/type';

export const useTicketListingApi = (
    fromDate: string,
    toDate: string,
    page: number,
    module: string
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [tableDetails, setTableDetails] = useState<ticketListingTableData[]>([]);
    const [count, setCount] = useState<number>();

    const [isLoading, setIsLoading] = useState(true);

    const getTicketList = useCallback(async () => {
        const data: ticketListingResponse | false = await ticketListing({
            userId: id,
            userType: role,
            fromDate,
            toDate,
            page,
            module,
        });

        if (data) {
            const listingData = data;
            const arr = listingData?.data?.map(item => ({
                date: item.createdAt ?? '',
                id: item.id,
                ticketId: item.ticketId ?? '',
                module: item.module ?? '',
                description: item.description ?? '',
                status: item.status ?? '',
                issueType: item.issueType ?? '',
                view: 'view',
            }));

            setTableDetails(arr);
            setCount(listingData.total);

            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, fromDate, toDate, page, module]);
    useEffect(() => {
        getTicketList();
    }, [getTicketList]);

    const handleDelete = async (ticketId: number) => {
        // Call the API to delete the item
        // await deleteTicketApi(id); // Replace with your actual API call

        // Update the data state to remove the item
        const updatedData = tableDetails.filter(item => Number(item.ticketId) !== ticketId);
        setTableDetails(updatedData);
    };

    return { data: tableDetails, isLoading, count, handleDelete, getTicketList };
};
