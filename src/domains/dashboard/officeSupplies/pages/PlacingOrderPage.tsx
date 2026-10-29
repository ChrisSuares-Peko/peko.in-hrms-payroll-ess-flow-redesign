import { useCallback, useEffect, useRef, useState } from 'react';

import { Button, Flex, Result, Spin, Typography, notification } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { getCheckoutResultApi } from '../api/cart';
import { setConfirmation } from '../slices/cartSlice';
import { CheckoutResultResponse, ConfirmedSellerGroup } from '../types/cartTypes';
import {
    REFUND_FALLBACK_MESSAGE,
    failedSellerNames,
    refundMessage,
    sellerStatusLabel,
} from '../utils/checkoutOutcome';

const { Text } = Typography;

// The payment callback sends each seller its /confirm; every seller then has 5
// minutes to answer on_confirm, after which it is refunded. Each read of
// checkout-result is also what settles the checkout on the server (times a silent
// seller out, completes it, refunds), so poll every 3 s for the whole window.
const POLL_INTERVAL_MS = 3000;
// Past this, tell the buyer some seller is slow rather than spin silently.
const SLOW_AFTER_MS = 60 * 1000;
// Keep reading a little past the slowest seller's deadline, so the read that
// settles its timeout — and shows the refund — still happens on this page.
const DEADLINE_GRACE_MS = 90 * 1000;
// An older backend sends no deadline — stop after this long instead.
const FALLBACK_BUDGET_MS = 7 * 60 * 1000;

const SELLER_STATUS_CLASS: Record<ConfirmedSellerGroup['status'], string> = {
    confirmed: 'text-[#15803d]',
    failed: 'text-[#b45309]',
    pending: 'text-black/45',
};

type PollOutcome = { done: boolean; deadlineAt?: string | null };

/**
 * Placing-order page — landing after Cashfree capture
 * (`successPath?status=success&transactionId=<paymentRef>`).
 *
 * Polls checkout-result every 3 s while the sellers answer the /confirm the
 * payment callback sent them; each poll also settles the checkout server-side.
 * Easy Split settlement is informational and does not block a confirmed order.
 */
const PlacingOrderPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [searchParams] = useSearchParams();
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [error, setError] = useState<string | null>(null);
    // We stopped polling before the backend produced a result. Distinct from
    // `error`: nothing failed, we just don't know the outcome yet.
    const [stillWorking, setStillWorking] = useState(false);
    // Latest in-progress answer: which sellers have confirmed, failed or not answered.
    const [progress, setProgress] = useState<CheckoutResultResponse | null>(null);
    // Past the first minute — some seller is slow, say so rather than spin silently.
    const [slow, setSlow] = useState(false);
    // StrictMode's double mount must not start two polling loops.
    const firedRef = useRef(false);

    // The engine appends the settled capture's corporateTxnId, which is the
    // Cashfree paymentRefId and becomes the ONDC payment reference.
    const paymentRef = searchParams.get('transactionId');
    const cartPath = `${paths.dashboard.officeSupplies}/${paths.officeSupplies.cartPage}`;

    /** One read of the outcome. `done` once a terminal state was handled. */
    const readResult = useCallback(async (): Promise<PollOutcome> => {
        const result = await getCheckoutResultApi({
            userId: id,
            userType: role,
            paymentRef: String(paymentRef),
        });

        // Transport failure — keep polling rather than declaring anything.
        if (!result) return { done: false };
        // Sellers are still answering. Show who has, and keep waiting.
        if (result.status === 'PENDING') {
            setProgress(result);
            return { done: false, deadlineAt: result.deadlineAt };
        }

        if (result.status === 'FAILED' || !result.anyConfirmed) {
            const failed = failedSellerNames(result.groups || []);
            const reason = failed
                ? `Your order could not be placed with the seller(s): ${failed}.`
                : 'Your order could not be placed with the sellers.';
            setError(`${reason} ${refundMessage(result.refund) || REFUND_FALLBACK_MESSAGE}`);
            return { done: true };
        }

        if (result.failedCount > 0) {
            notification.warning({
                message: 'Some items could not be ordered',
                description: [
                    `Items from ${failedSellerNames(result.groups)} could not be placed and are excluded from this order.`,
                    refundMessage(result.refund),
                ]
                    .filter(Boolean)
                    .join(' '),
            });
        }

        dispatch(
            setConfirmation({
                ...result,
                paymentRef: String(paymentRef),
                confirmedAt: result.confirmedAt || new Date().toISOString(),
            })
        );

        // Seller payout (Cashfree Easy Split) — order is already placed.
        const { settlement } = result;
        if (
            (settlement?.status === 'PARTIAL' || settlement?.status === 'FAILED') &&
            settlement.skipped?.length
        ) {
            notification.warning({
                message: 'Seller settlement is still pending for some sellers',
                description: `${settlement.skipped
                    .map(s => s.seller)
                    .join(', ')} could not be settled automatically. Your order is placed — our team will complete their payout.`,
            });
        } else if (settlement?.status === 'FAILED') {
            notification.warning({
                message: 'Seller settlement is still pending',
                description:
                    'Your order is placed. Automatic seller payout could not complete — our team will finish it.',
            });
        }

        navigate(`${paths.dashboard.officeSupplies}/${paths.officeSupplies.orderPlaced}`, {
            replace: true,
        });
        return { done: true };
    }, [dispatch, id, navigate, paymentRef, role]);

    useEffect(() => {
        if (firedRef.current) return undefined;
        // Nothing to read: this wasn't reached from a settled payment.
        if (!paymentRef) {
            navigate(cartPath, { replace: true });
            return undefined;
        }
        firedRef.current = true;

        // The payment callback has already sent each seller its /confirm. The first
        // read often resolves at once; polling covers slow sellers — up to the
        // server's deadline for the slowest one, after which it refunds them.
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout>;
        const startedAt = Date.now();
        let stopAt = startedAt + FALLBACK_BUDGET_MS;

        const tick = async () => {
            if (cancelled) return;
            const { done, deadlineAt } = await readResult();
            if (done || cancelled) return;

            const deadline = deadlineAt ? Date.parse(deadlineAt) : NaN;
            if (Number.isFinite(deadline)) stopAt = deadline + DEADLINE_GRACE_MS;

            const elapsed = Date.now() - startedAt;
            if (elapsed >= SLOW_AFTER_MS) setSlow(true);
            if (Date.now() >= stopAt) {
                setStillWorking(true);
                return;
            }
            timer = setTimeout(tick, POLL_INTERVAL_MS);
        };
        tick();

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [cartPath, navigate, paymentRef, readResult]);

    // Nothing is lost by leaving — the backend owns the order now — but a reload
    // mid-chain means the buyer loses sight of the outcome, so still warn.
    useEffect(() => {
        if (error || stillWorking) return undefined;
        const warn = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [error, stillWorking]);

    // We stopped waiting before the backend reported an outcome. The order may well
    // have been placed — the backend owns it now — so this must not read as failure,
    // and it must not tell the buyer to pay again.
    if (stillWorking) {
        return (
            <Flex align="center" justify="center" className="w-full px-4 py-10">
                <Result
                    status="info"
                    title="We're still finalising your order"
                    subTitle={
                        <Flex vertical gap={6} align="center">
                            <Text className="text-[15px] text-black/65">
                                Your payment went through. Placing the order with the seller(s) is
                                taking longer than usual and is still being completed in the
                                background — check Order History in a few minutes. Anything that
                                can&apos;t be placed is refunded automatically. You don&apos;t need
                                to pay again.
                            </Text>
                            <Text className="text-[13px] text-black/45">
                                Payment reference: {paymentRef}
                            </Text>
                        </Flex>
                    }
                    extra={[
                        <Button
                            key="history"
                            type="primary"
                            danger
                            onClick={() =>
                                navigate(
                                    `${paths.dashboard.officeSupplies}/${paths.officeSupplies.orderHistory}`
                                )
                            }
                        >
                            View order history
                        </Button>,
                        <Button
                            key="shop"
                            onClick={() => navigate(paths.dashboard.officeSupplies)}
                        >
                            Continue shopping
                        </Button>,
                    ]}
                />
            </Flex>
        );
    }

    if (error) {
        return (
            <Flex align="center" justify="center" className="w-full px-4 py-10">
                <Result
                    status="warning"
                    title="We couldn't place your order"
                    subTitle={
                        <Flex vertical gap={6} align="center">
                            <Text className="text-[15px] text-black/65">{error}</Text>
                            <Text className="text-[13px] text-black/45">
                                Payment reference: {paymentRef}
                            </Text>
                        </Flex>
                    }
                    extra={[
                        <Button
                            key="history"
                            type="primary"
                            danger
                            onClick={() =>
                                navigate(
                                    `${paths.dashboard.officeSupplies}/${paths.officeSupplies.orderHistory}`
                                )
                            }
                        >
                            View order history
                        </Button>,
                        <Button key="cart" onClick={() => navigate(cartPath)}>
                            Back to cart
                        </Button>,
                    ]}
                />
            </Flex>
        );
    }

    return (
        <Flex
            vertical
            align="center"
            justify="center"
            gap={18}
            className="min-h-[60vh] w-full px-4 py-10 text-center"
        >
            <Spin size="large" />
            <Text className="text-[19px] font-medium text-black/85">
                Placing your order with the seller(s)…
            </Text>
            <Text className="max-w-[420px] text-[15px] text-black/45">
                {slow
                    ? "Some sellers are taking longer to respond — this can take up to 5 minutes. Anything we can't place is refunded automatically."
                    : "Your payment went through. This usually takes under a minute — please don't close or refresh this window."}
            </Text>
            {/* Per-seller progress, once the backend reports it */}
            {progress?.groups?.length ? (
                <Flex vertical gap={8} className="w-full max-w-[420px]">
                    {progress.groups.map((group, index) => (
                        <Flex
                            key={group.transactionId || `${group.providerId}-${index}`}
                            justify="space-between"
                            align="center"
                            gap={12}
                            wrap="wrap"
                            className="rounded-md border border-solid border-[#e6e6e6] bg-white px-4 py-3"
                        >
                            <Text className="break-words text-left text-[15px] text-black/85">
                                {group.vendorName || group.bppId || 'Seller'}
                            </Text>
                            <Flex align="center" gap={6}>
                                {group.status === 'pending' && <Spin size="small" />}
                                <Text
                                    className={`text-[14px] font-medium ${SELLER_STATUS_CLASS[group.status] || SELLER_STATUS_CLASS.pending}`}
                                >
                                    {sellerStatusLabel(group.status)}
                                </Text>
                            </Flex>
                        </Flex>
                    ))}
                </Flex>
            ) : null}
        </Flex>
    );
};

export default PlacingOrderPage;
