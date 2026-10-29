import { useState } from 'react';

import { useDispatch } from 'react-redux';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { ticketRaise } from '../api/index';
import { TicketRaisePayload, SupportTicketResponse } from '../types/type';

export default function useTicketCreate() {
    const dispatch = useDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [responseData, setResponseData] = useState<SupportTicketResponse | false>();
    const [isLoading, setIsLoading] = useState(false);

    const handleTicketCreation = async (payload: TicketRaisePayload) => {
        setIsLoading(true);
        const response: false | SuccessGenericResponse<SupportTicketResponse> = await ticketRaise({
            ...payload,
            userId: id,
            userType: role,
        });
        if (response !== false) {
            setResponseData(response.data);
            if (response.status) {
                dispatch(
                    showToast({
                        description: 'Ticket created successfully',
                        variant: 'success',
                    })
                );
            }
            setIsLoading(false);
        }
    };
    return { handleTicketCreation, responseData, isLoading };
}
