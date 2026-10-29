import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { decideApprovals } from '../api/approvals';
import { ApprovalDecisionPayload } from '../types/approvals';

export default function useApprovalDecision() {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isDeciding, setIsDeciding] = useState(false);

    const decide = useCallback(
        async (payload: ApprovalDecisionPayload) => {
            setIsDeciding(true);
            const result = await decideApprovals({ userId: id, userType: role, ...payload });
            setIsDeciding(false);
            if (!result) {
                dispatch(
                    showToast({
                        description: 'Could not record this decision. Please try again.',
                        variant: 'error',
                    })
                );
            }
            return result;
        },
        [dispatch, id, role]
    );

    return { decide, isDeciding };
}
