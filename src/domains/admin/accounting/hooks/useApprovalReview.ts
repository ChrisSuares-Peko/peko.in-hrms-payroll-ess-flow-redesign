import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getApprovalReview } from '../api/approvals';
import { ApprovalReview } from '../types/approvals';

export type ApprovalTarget = { partnerPermissionId: number; nodeKey: string };

export default function useApprovalReview(target: ApprovalTarget | null) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [review, setReview] = useState<ApprovalReview | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const partnerPermissionId = target?.partnerPermissionId ?? null;
    const nodeKey = target?.nodeKey ?? null;

    const load = useCallback(async () => {
        if (!partnerPermissionId || !nodeKey) {
            setReview(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const result = await getApprovalReview({
            userId: id,
            userType: role,
            partnerPermissionId,
            nodeKey,
        });
        setReview(result || null);
        setIsLoading(false);
    }, [id, role, partnerPermissionId, nodeKey]);

    useEffect(() => {
        load();
    }, [load]);

    return { review, isLoading, refetch: load };
}
