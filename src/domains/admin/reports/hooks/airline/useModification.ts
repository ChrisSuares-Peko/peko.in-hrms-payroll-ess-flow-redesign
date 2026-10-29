import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    rejectModificationPaymentApi,
    updateFlightTicketApi,
    updateTicketPriceApi,
} from '../../api/airline/modification';

const useModification = (getAllTableData: () => void) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isLoadingNewTicket, setIsLoadingNewTicket] = useState(false);
    const dispatch = useAppDispatch();

    const saveUpdatedTicketPrice = async (payload2: any): Promise<boolean> => {
        setIsLoading(true);
        // Define the type for the response from refundApi
        const data: any | false = await updateTicketPriceApi({
            userId: id,
            userType: role,
            ...payload2,
        });

        setIsLoading(false);
        if (data) {
            return true;
        }

        return false;
    };
    const uploadNewTicket = async (payload: any): Promise<boolean> => {
        setIsLoadingNewTicket(true);
        // Define the type for the response from refundApi
        const data: any | false = await updateFlightTicketApi({
            userId: id,
            userType: role,
            ...payload,
        });

        setIsLoadingNewTicket(false);
        if (data) {
            dispatch(showToast({ description: 'New flight ticket uploaded.', variant: 'success' }));
            getAllTableData();
            return true;
        }

        return false;
    };
    const rejectModificationPayment = async (payload: any): Promise<boolean> => {
        setIsCancelling(true);
        const data: any | false = await rejectModificationPaymentApi({
            userId: id,
            userType: role,
            ...payload,
        });

        setIsCancelling(false);
        if (data) {
            dispatch(
                showToast({
                    description: 'Modification cancelled successfully',
                    variant: 'success',
                })
            );
            getAllTableData();
            return true;
        }

        return false;
    };
    return {
        isLoading,
        isCancelling,
        isLoadingNewTicket,
        saveUpdatedTicketPrice,
        uploadNewTicket,
        rejectModificationPayment,
    };
};

export default useModification;
