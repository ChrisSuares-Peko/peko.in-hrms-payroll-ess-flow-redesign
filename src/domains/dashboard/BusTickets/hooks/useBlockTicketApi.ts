import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { blockTicket } from '../api';
import { InventoryItem } from '../types/buslist';

export default function useBlockTicketApi() {
    const { role, id }  = useAppSelector(state => state.reducer.auth);
    const tripInfo      = useAppSelector(state => state.reducer.busTicket.selectedTripInfo);
    const sourceId      = useAppSelector(state => state.reducer.busTicket.sourceId);
    const destinationId = useAppSelector(state => state.reducer.busTicket.destinationId);

    const [isLoading, setIsLoading] = useState(false);

    const block = async (inventoryItems: InventoryItem[]): Promise<{ data: Awaited<ReturnType<typeof blockTicket>>; error?: string; responseCode?: string }> => {
        setIsLoading(true);
        try {
            const data = await blockTicket({
                userId: id,
                userType: role,
                payload: {
                    availableTripId:  tripInfo?.busId ?? '',
                    boardingPointId:  Number(tripInfo?.boardingPointId) || 0,
                    droppingPointId:  Number(tripInfo?.droppingPointId) || 0,
                    source:           Number(sourceId),
                    destination:      Number(destinationId),
                    inventoryItems,
                },
            });
            return { data };
        } catch (err: any) {
            return { data: null, error: err?.message || 'Something went wrong. Please try again.', responseCode: err?.responseCode };
        } finally {
            setIsLoading(false);
        }
    };

    return { block, isLoading };
}
