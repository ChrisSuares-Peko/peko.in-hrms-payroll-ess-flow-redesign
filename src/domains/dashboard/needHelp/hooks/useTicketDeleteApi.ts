import { useState, useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteTicket } from '../api/index';
import { supportTicketDeletedResponse } from '../types/type';

export const useDeleteTicketApi = (ticketId: number | null) => {
    const dispatch = useDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [ticketDetails, setTicketDetails] = useState<supportTicketDeletedResponse>();

    const [isLoading, setIsLoading] = useState(true);

    const deleteTicketData = useCallback(async () => {
        const data: SuccessGenericResponse<supportTicketDeletedResponse> | false =
            await deleteTicket({
                userId: id,
                userType: role,
                ticketId,
            });

        if (data) {
            const ticketDetailData = data.data as supportTicketDeletedResponse;
            setTicketDetails(ticketDetailData);
            if (data.status) {
                dispatch(
                    showToast({
                        description: 'Ticket deleted successfully',
                        variant: 'success',
                    })
                );
            }
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [dispatch, id, role, ticketId]);

    return { deleteTicketData, loading: isLoading };
};
