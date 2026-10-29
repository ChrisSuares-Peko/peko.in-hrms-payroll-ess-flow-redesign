import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { IssueCardByAdminPayload, issueCardByAdmin } from '../../api/admin/issueCardApi';

export const useIssueCardApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const submitIssueCard = async (payload: IssueCardByAdminPayload) => {
        setIsLoading(true);
        const res = await issueCardByAdmin(role, id, payload);
        setIsLoading(false);
        return res;
    };

    return { submitIssueCard, isLoading };
};
