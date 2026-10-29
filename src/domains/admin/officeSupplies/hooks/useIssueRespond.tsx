import { useCallback, useEffect, useState } from 'react';

import { v4 as uuidv4 } from 'uuid';

import { useAppSelector } from '@src/hooks/store';

import { getIssueByIdApi, respondToIssueApi } from '../api/issues';
import { AdminIssueDetail, AdminIssueStatus } from '../types/adminOndcIssue';

/** Single-issue detail + the admin response flow (Issues tab detail modal). */
const useIssueRespond = (id: number | null) => {
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const [issue, setIssue] = useState<AdminIssueDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isResponding, setIsResponding] = useState(false);

    const fetchIssue = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        const data = await getIssueByIdApi({ userId, userType: role, id });
        if (data) setIssue(data);
        setIsLoading(false);
    }, [id, userId, role]);

    useEffect(() => {
        fetchIssue();
    }, [fetchIssue]);

    const respond = useCallback(
        async (message: string, action: AdminIssueStatus): Promise<boolean> => {
            if (!id) return false;
            setIsResponding(true);
            const clientRequestId = uuidv4();
            const success = await respondToIssueApi({
                userId,
                userType: role,
                id,
                message,
                action,
                clientRequestId,
            });
            if (success) await fetchIssue();
            setIsResponding(false);
            return !!success;
        },
        [id, userId, role, fetchIssue]
    );

    return { issue, isLoading, isResponding, fetchIssue, respond };
};

export default useIssueRespond;
