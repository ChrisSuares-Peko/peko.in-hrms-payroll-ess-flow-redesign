import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { downloadTicket } from '../Api';

export default function useTicketDownloadApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isLoading, setIsLoading] = useState(true);
    const download = useCallback(
        async (orderId: number) => {
            const data = await downloadTicket({
                userId: id,
                userType: role,
                orderId,
            });

            return data;
        },
        [id, role]
    );
    return { isLoading, download };
}
