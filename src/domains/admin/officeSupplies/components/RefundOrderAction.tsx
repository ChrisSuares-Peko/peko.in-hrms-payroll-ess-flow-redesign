import { useState } from 'react';

import { RollbackOutlined } from '@ant-design/icons';
import { Button, Flex, Input, InputNumber, Modal, Tooltip, Typography } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { refundOndcOrderApi } from '../api/order';

const { Text } = Typography;

const inr = (n: number) => `₹${formatNumberWithLocalString(Number(n || 0))}`;

/**
 * Why a refund isn't available, in the admin's language. Keys are the reason codes
 * from REASONS in services/ondcOrderRefund.js.
 */
const INELIGIBLE_REASON: Record<string, string> = {
    not_delayed: 'Available once the order is delayed — its delivery date has not passed yet',
    already_delivered: 'This order was delivered, so it is not delayed',
    payout_already_released: 'The seller has already been settled for this order',
    nothing_left_to_refund: 'Already fully refunded',
    order_cancelled: 'This order is cancelled',
    no_payment_ref: 'No payment reference on this order — it cannot be refunded automatically',
    order_not_found: 'Order not found',
};

type Props = {
    /**
     * Only the fields the refund needs, so this works from both the orders list row
     * and the order-detail page without either having to load the other's shape.
     */
    order: {
        id: number | string;
        refundEligible?: boolean;
        refundableAmount?: number | null;
        refundedAmount?: string | number | null;
        refundIneligibleReason?: string | null;
    };
    /** Refetch after a successful refund. */
    onDone: () => void;
    /** `block` for the detail sidebar, `icon` for a table row. */
    variant?: 'block' | 'icon';
};

/**
 * The whole admin refund flow — eligibility, amount, submit — in one place so the
 * orders list and the order-detail page share it rather than each keeping a copy of a
 * money action.
 *
 * No OTP step: the amount modal is the only confirmation. Renders nothing (or a
 * disabled button with the reason) unless the server says the order is refundable.
 * `refundEligible` is computed server-side from the delivery date; it is deliberately
 * NOT re-derived here.
 */
const RefundOrderAction = ({ order, onDone, variant = 'block' }: Props) => {
    const dispatch = useAppDispatch();
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);

    const [amountOpen, setAmountOpen] = useState(false);
    const [isRefunding, setIsRefunding] = useState(false);
    const [amount, setAmount] = useState<number | null>(null);
    const [reason, setReason] = useState('');

    if (!order.refundEligible) {
        // In a table, a disabled icon on every row is noise — hide it there. On the
        // detail page show it disabled with the reason, so an admin looking for the
        // action learns why it is unavailable instead of wondering if it exists.
        if (variant === 'icon') return null;
        const why =
            INELIGIBLE_REASON[order.refundIneligibleReason || ''] ||
            'Available once the order is delayed';
        return (
            <Tooltip title={why}>
                <Button danger icon={<RollbackOutlined />} disabled block>
                    Refund
                </Button>
            </Tooltip>
        );
    }

    const ceiling = Number(order.refundableAmount || 0);
    const alreadyRefunded = Number(order.refundedAmount || 0);

    const openAmountStep = () => {
        setAmount(ceiling || null);
        setReason('');
        setAmountOpen(true);
    };

    const submitRefund = async () => {
        if (!amount || amount <= 0) {
            dispatch(showToast({ variant: 'error', description: 'Enter a refund amount.' }));
            return;
        }
        setIsRefunding(true);
        try {
            await refundOndcOrderApi({
                userId,
                userType: role,
                id: order.id,
                amount,
                reason: reason || undefined,
            });
            dispatch(showToast({ variant: 'success', description: 'Refund initiated.' }));
            setAmountOpen(false);
            onDone();
        } catch (err: any) {
            // The server's reasons are specific and actionable — not delayed yet,
            // already fully refunded, the gateway rejected it — so surface them
            // rather than a generic failure.
            dispatch(
                showToast({
                    variant: 'error',
                    description:
                        err?.response?.data?.message || err?.message || 'Refund could not be processed.',
                })
            );
        } finally {
            setIsRefunding(false);
        }
    };

    return (
        <>
            {variant === 'icon' ? (
                <Tooltip title="Refund buyer">
                    <RollbackOutlined className="cursor-pointer text-[#ef4444]" onClick={openAmountStep} />
                </Tooltip>
            ) : (
                <Button danger icon={<RollbackOutlined />} loading={isRefunding} onClick={openAmountStep} block>
                    Refund
                </Button>
            )}

            <Modal
                title="Refund to buyer"
                open={amountOpen}
                okText={amount ? `Refund ${inr(amount)}` : 'Refund'}
                okButtonProps={{ danger: true }}
                confirmLoading={isRefunding}
                onCancel={() => setAmountOpen(false)}
                onOk={submitRefund}
            >
                <Flex vertical gap={14} className="pt-2">
                    <Text className="text-[13px] text-[#4a5565]">
                        This order is past its delivery date. Refunds the buyer through the payment gateway and
                        stops the seller&apos;s pending payout for this order.
                    </Text>
                    <Flex vertical gap={4}>
                        <Text className="text-[13px] font-medium text-[#101828]">Amount</Text>
                        <InputNumber
                            value={amount}
                            onChange={value => setAmount(value as number | null)}
                            min={0.01}
                            max={ceiling}
                            precision={2}
                            prefix="₹"
                            className="w-full"
                            autoFocus
                        />
                        <Text className="text-[12px] text-[#667085]">
                            Up to {inr(ceiling)}
                            {alreadyRefunded > 0 && ` (${inr(alreadyRefunded)} already refunded)`}
                        </Text>
                    </Flex>
                    <Flex vertical gap={4}>
                        <Text className="text-[13px] font-medium text-[#101828]">Reason (optional)</Text>
                        <Input.TextArea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            maxLength={500}
                            rows={3}
                            placeholder="e.g. item damaged on arrival"
                        />
                    </Flex>
                </Flex>
            </Modal>
        </>
    );
};

export default RefundOrderAction;
