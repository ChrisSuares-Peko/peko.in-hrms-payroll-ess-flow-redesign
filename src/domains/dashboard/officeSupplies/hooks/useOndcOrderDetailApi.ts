import { useCallback, useEffect, useState } from 'react';

import { v4 as uuidv4 } from 'uuid';

import { useAppSelector } from '@src/hooks/store';

import {
    cancelOndcOrderApi,
    getOndcOrderByIdApi,
    getOndcOrderIssuesApi,
    raiseOndcIssueApi,
    refreshOndcOrderStatusApi,
    refreshOndcOrderTrackingApi,
    respondToOndcIssueApi,
    returnOndcOrderApi,
    rejectOndcIssueApi,
    escalateOndcIssueApi,
    acceptOndcIssueApi,
    closeOndcIssueApi,
} from '../api/ondcOrderHistory';
import { OndcIssue } from '../types/ondcIssue';
import { OndcOrderDetail, OndcOrderRefreshResult } from '../types/ondcOrderHistory';
import { IssuePhoto } from '../utils/issuePhoto';

/** Fetches a single confirmed ONDC order and manages backend ONDC issues. */
export function useOndcOrderDetailApi(id: string) {
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const [order, setOrder] = useState<OndcOrderDetail | null>(null);
    const [issues, setIssues] = useState<OndcIssue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
    const [isRefreshingTracking, setIsRefreshingTracking] = useState(false);

    const fetchIssues = useCallback(async () => {
        if (!id) return;
        const list = await getOndcOrderIssuesApi({ userId, userType: role, id });
        setIssues(list);
    }, [id, userId, role]);

    const fetchOrder = useCallback(async () => {
        setIsLoading(true);
        const data = await getOndcOrderByIdApi({ userId, userType: role, id });
        if (data) {
            setOrder(data);
            await fetchIssues();
        } else {
            setNotFound(true);
        }
        setIsLoading(false);
    }, [userId, role, id, fetchIssues]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    const refreshStatus = useCallback(async (): Promise<false | OndcOrderRefreshResult> => {
        setIsRefreshingStatus(true);
        try {
            const result = await refreshOndcOrderStatusApi({ userId, userType: role, id });
            if (result && result.order) setOrder(result.order);
            return result;
        } finally {
            setIsRefreshingStatus(false);
        }
    }, [userId, role, id]);

    const refreshTracking = useCallback(async (): Promise<false | OndcOrderRefreshResult> => {
        setIsRefreshingTracking(true);
        try {
            const result = await refreshOndcOrderTrackingApi({ userId, userType: role, id });
            if (result && result.order) setOrder(result.order);
            return result;
        } finally {
            setIsRefreshingTracking(false);
        }
    }, [userId, role, id]);

    const cancelOrder = useCallback(
        async (reason: string, description: string) => {
            const result = await cancelOndcOrderApi({
                userId,
                userType: role,
                id,
                reason,
                description,
            });
            if (result) await fetchOrder();
            return result;
        },
        [userId, role, id, fetchOrder]
    );

    const returnOrder = useCallback(
        async (payload: {
            items: { itemId: string; quantity: number }[];
            reasonId: string;
            reasonDesc: string;
            images?: IssuePhoto[];
            replace?: boolean;
        }) => {
            const result = await returnOndcOrderApi({
                userId,
                userType: role,
                id,
                ...payload,
            });
            if (result) await fetchOrder();
            return result;
        },
        [userId, role, id, fetchOrder]
    );

    const raiseIssue = useCallback(
        async (
            category: string,
            subCategory: string,
            description: string,
            images?: IssuePhoto[]
        ): Promise<boolean> => {
            if (!id) return false;
            const clientRequestId = uuidv4();
            const success = await raiseOndcIssueApi({
                userId,
                userType: role,
                id,
                category,
                subCategory,
                description,
                images,
                clientRequestId,
            });
            if (success) {
                await fetchIssues();
                return true;
            }
            return false;
        },
        [id, userId, role, fetchIssues]
    );

    const replyToIssue = useCallback(
        async (
            issueId: number,
            message: string,
            cannotProvideProof?: boolean,
            images?: IssuePhoto[]
        ): Promise<boolean> => {
            if (!id) return false;
            const clientRequestId = uuidv4();
            const success = await respondToOndcIssueApi({
                userId,
                userType: role,
                id,
                issueId,
                message,
                cannotProvideProof,
                images,
                clientRequestId,
            });
            if (success) {
                await fetchIssues();
            }
            return success;
        },
        [id, userId, role, fetchIssues]
    );

    const runIssueAction = useCallback(
        async (
            issueId: number,
            action: 'reject' | 'escalate' | 'accept' | 'close',
            resolutionId?: string | null
        ) => {
            if (!id) return false;
            const apis = {
                reject: rejectOndcIssueApi,
                escalate: escalateOndcIssueApi,
                accept: acceptOndcIssueApi,
                close: closeOndcIssueApi,
            };
            const success = await apis[action]({ userId, userType: role, id, issueId, resolutionId });
            if (success) await fetchIssues();
            return success;
        },
        [id, userId, role, fetchIssues]
    );

    return {
        order,
        issues,
        isLoading,
        notFound,
        isRefreshingStatus,
        isRefreshingTracking,
        refreshStatus,
        refreshTracking,
        cancelOrder,
        returnOrder,
        raiseIssue,
        replyToIssue,
        rejectIssue: (issueId: number) => runIssueAction(issueId, 'reject'),
        escalateIssue: (issueId: number) => runIssueAction(issueId, 'escalate'),
        acceptIssue: (issueId: number, resolutionId?: string | null) =>
            runIssueAction(issueId, 'accept', resolutionId),
        closeIssue: (issueId: number) => runIssueAction(issueId, 'close'),
    };
}
