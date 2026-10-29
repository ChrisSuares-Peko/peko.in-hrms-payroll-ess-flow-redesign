import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { cancellationCharge } from '../Api';
import { cancelArray, cancellationData } from '../types/types';

export default function useCancellationApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [charges, setCharges] = useState<cancelArray[]>([]);

    const cancellation = useCallback(
        async (bookingRId: string, conversationid: string) => {
            setIsLoading(true);
            const data: cancellationData | false = await cancellationCharge({
                userId: id,
                userType: role,
                conversationId: conversationid,
                bookingReferenceId: bookingRId,
            });

            setIsLoading(false);
            return data;
        },
        [role, id]
    );

    return { isLoading, cancellation };
}
