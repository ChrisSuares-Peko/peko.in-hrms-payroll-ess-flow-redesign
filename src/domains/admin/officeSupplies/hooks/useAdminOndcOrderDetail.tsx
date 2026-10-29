import { useCallback, useEffect, useState } from 'react';

import { Scope } from '@src/enums/enums';
import { useAppSelector } from '@src/hooks/store';

import { getOndcOrderByIdAdminApi, getOtpEcommerce, updateOrderDetails } from '../api/order';
import { AdminOndcOrderDetail } from '../types/types';

/**
 * Single admin ONDC order detail (unscoped by buyer) + a refresh and an
 * OTP-gated cancel, for the order-detail page. Cancel reuses the existing
 * admin `updateOrderDetails` (PUT cancelAndRefund/?ondcOrderId=…) flow.
 */
const useAdminOndcOrderDetail = (id?: string) => {
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const [order, setOrder] = useState<AdminOndcOrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const fetchOrder = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        const data = await getOndcOrderByIdAdminApi({ userId, userType: role, id });
        if (data) setOrder(data);
        else setNotFound(true);
        setIsLoading(false);
    }, [id, userId, role]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    /** Dev/test returns `{ otp }`; production emails the OTP and returns success only. */
    const requestOtp = useCallback(() => getOtpEcommerce({ userId, userType: role }), [userId, role]);

    const cancelOrder = useCallback(
        async (otp: string, reason?: string): Promise<boolean> => {
            if (!id) return false;
            setIsCancelling(true);
            const resp = await updateOrderDetails({
                userId,
                userType: role,
                ondcOrderId: id,
                otp,
                scope: Scope.EMAIL,
                workspaceOrderStatus: 'Cancel approved',
                reason,
            });
            if (resp) await fetchOrder();
            setIsCancelling(false);
            return !!resp;
        },
        [id, userId, role, fetchOrder]
    );

    // Refund lives in components/RefundOrderAction.tsx, which owns its own amount +
    // OTP steps so the orders list and this page share one implementation of an
    // OTP-gated money action rather than each keeping a copy.
    return { order, isLoading, notFound, isCancelling, refresh: fetchOrder, requestOtp, cancelOrder };
};

export default useAdminOndcOrderDetail;
