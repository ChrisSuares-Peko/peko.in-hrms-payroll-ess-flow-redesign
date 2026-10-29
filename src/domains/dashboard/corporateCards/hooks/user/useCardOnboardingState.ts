import { useCallback, useEffect } from 'react';

import { UserRole } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getCardOnboardingState } from '../../api/user/membershipApi';
import { setCardKybComplete } from '../../slices/corporateCardsSlice';
import { holdsCardMembership } from '../../utils/activeRole';

/**
 * Whether this employee's employer has finished Corporate Cards KYB.
 *
 * Asked only for an employee who holds no membership, because that is the only session the answer changes
 * anything for: a member reaches the service through their own grant, and no other role reaches it this way
 * at all. The endpoint sits ahead of the service gate for the same reason — the caller does not hold the
 * service yet.
 *
 * The answer lands in Redux so the sidebar and the route guards read it synchronously. It stays `null` until
 * it arrives, and `null` is not `false`: a session that has not asked yet must not be told no.
 */
export const useCardOnboardingState = () => {
    const dispatch = useAppDispatch();
    const { role, id, employeeProfileId, serviceMemberships } = useAppSelector(
        state => state.reducer.auth
    );
    const { cardKybComplete } = useAppSelector(state => state.reducer.corporateCards);

    const isMember = holdsCardMembership(role, employeeProfileId, serviceMemberships);
    const shouldAsk = role === UserRole.EMPLOYEE && !isMember && cardKybComplete === null;

    const fetchState = useCallback(async () => {
        const data = await getCardOnboardingState(role, id);
        dispatch(setCardKybComplete(data ? data.kybComplete === true : false));
    }, [dispatch, role, id]);

    useEffect(() => {
        if (shouldAsk) fetchState();
    }, [shouldAsk, fetchState]);

    return { cardKybComplete, refetch: fetchState };
};
