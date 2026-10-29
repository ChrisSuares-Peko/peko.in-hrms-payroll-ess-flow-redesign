import { useCallback, useEffect, useState } from 'react';

import { SuccessGenericResponse, commonSelectType } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllCorporates, ticketRaise } from '../api/index';
import {
    CorporateListResponse,
    TicketRaisePayload,
    supportTicketRaiseResponse,
} from '../types/type';

export default function useTicketCreate() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [responseData, setResponseData] = useState<supportTicketRaiseResponse | false>();
    const [corporateList, setCorporateList] = useState<commonSelectType[]>([
        { oName: '', oValue: '' },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [initialVal, setInitialVal] = useState<commonSelectType[]>([{ oName: '', oValue: '' }]);
    const dispatch = useAppDispatch();

    const handleTicketCreation = async (payload: TicketRaisePayload) => {
        setIsLoading(true);
        const response: false | SuccessGenericResponse<supportTicketRaiseResponse> =
            await ticketRaise({
                ...payload,
                userId: id,
                userType: role,
            });
        if (response) {
            if (response.status) {
                dispatch(
                    showToast({
                        description: `Ticket added successfully`,
                        variant: 'success',
                    })
                );
            }

            setResponseData(response.data);
            setIsLoading(false);
        }
    };

    const getCorporateList = useCallback(async () => {
        const data: CorporateListResponse | false = await getAllCorporates({
            userId: id,
            userType: role,
            searchText: '',
        });
        if (data) {
            const { result } = data;

            const arr = result.map(corporate => ({
                oName: `${corporate.name} ${corporate.username}`,
                oValue: corporate.id,
            }));
            setInitialVal(arr);
            setCorporateList(arr);
        }
    }, [id, role]);

    useEffect(() => {
        getCorporateList();
    }, [getCorporateList]);

    return {
        handleTicketCreation,
        responseData,
        isLoading,
        corporateList,
        setCorporateList,
        initialVal,
    };
}
