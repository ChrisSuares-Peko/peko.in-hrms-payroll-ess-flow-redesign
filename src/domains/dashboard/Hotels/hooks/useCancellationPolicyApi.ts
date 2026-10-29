import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { cancellationPolicy } from '../Api';
import { getCancelPolicy } from '../slices/getHotelSlice';
import { HotelCancellationPolicy, cancelpolicyRoom, roomDatas } from '../types/cancellationTypes';

export default function useCancellationPolicyApi() {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isLoading, setIsLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [policyData, setPolicyData] = useState<cancelpolicyRoom[]>([]);
    const cancellationPolicyDetails = useCallback(
        async (
            conversationIds: string,
            hotelKeys: string,
            searchKeys: string,
            roomInfo: roomDatas[],
            cultureData: string
        ) => {
            const data: HotelCancellationPolicy | false = await cancellationPolicy({
                userId: id,
                userType: role,
                hotelKey: hotelKeys,
                searchKey: searchKeys,
                conversationId: conversationIds,
                rooms: roomInfo,
                culture: cultureData,
            });

            if (data) {
                dispatch(getCancelPolicy(data));
                const cancelData = data.data as cancelpolicyRoom[];
                setPolicyData(cancelData);
                return cancelData;
            }
            return []; // Return an empty array if data is false
        },
        [id, role, dispatch]
    );

    return { isLoading, cancellationPolicyDetails };
}
