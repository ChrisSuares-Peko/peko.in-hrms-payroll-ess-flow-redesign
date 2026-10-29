import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { IssueCardRequest, issueCard } from '../../api/user/cardsApi';

export const useIssueCardApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const submitIssueCard = async (payload: IssueCardRequest) => {
        setIsLoading(true);
        const res = await issueCard(role, id, payload);
        setIsLoading(false);
        return res;
    };

    return { submitIssueCard, isLoading };
};
