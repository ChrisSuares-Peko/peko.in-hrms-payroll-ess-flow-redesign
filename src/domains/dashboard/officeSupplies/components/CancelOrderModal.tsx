import { useState, type FC } from 'react';

import { CloseOutlined, InfoCircleFilled, ShoppingOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Modal, Select, Typography } from 'antd';

import { formatInr } from '../utils/priceInr';

const { Text } = Typography;
const { TextArea } = Input;

interface CancelOrderModalProps {
    open: boolean;
    onClose: () => void;
    orderId: string;
    refundAmount: number;
    isPrepaid: boolean;
    /** Calls the real ONDC /cancel flow and resolves once the seller's
     *  on_cancel callback (or a failure) comes back — the form only resets
     *  on a truthy result, so a failure leaves the reason/description intact
     *  for the customer to retry without re-entering everything. */
    onSubmit: (reason: string, description: string) => Promise<boolean>;
}

/**
 * Reasons a buyer might cancel an already-CONFIRMED order — distinct from
 * (and not reusing) the legacy pre-checkout cancel flow's reason list
 * (`orderCancellationReasons` in utils/data.ts), since several of those
 * ("Need to Change Shipping Address", "Need to change Payment Method") are
 * pre-checkout concerns that don't fit cancelling a placed order.
 */
const CANCEL_REASONS = [
    'Ordered by mistake',
    'No longer need this item',
    'Found a better price elsewhere',
    'Delivery is taking too long',
    "Item details didn't match what I expected",
    'Other',
];

/** "Cancel order" form (Figma 2451-24478) — reason + description, replacing
 *  the previous generic confirm dialog. Follows LocationModal's Modal
 *  conventions (closable={false} + a custom header close button, centered). */
const CancelOrderModal: FC<CancelOrderModalProps> = ({
    open,
    onClose,
    orderId,
    refundAmount,
    isPrepaid,
    onSubmit,
}) => {
    const [reason, setReason] = useState<string>();
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reset = () => {
        setReason(undefined);
        setDescription('');
    };

    const close = () => {
        // Guards every dismiss path (mask click, Esc, the custom X button
        // below) — not just the "Keep order" button — so the modal can't be
        // torn down while a cancel request is still in flight.
        if (isSubmitting) return;
        reset();
        onClose();
    };

    const handleSubmit = async () => {
        if (!reason) return;
        setIsSubmitting(true);
        const succeeded = await onSubmit(reason, description);
        setIsSubmitting(false);
        // Only clear the form on success — a failure keeps the customer's
        // reason/description so they can retry without re-entering them.
        if (succeeded) reset();
    };

    return (
        <Modal
            open={open}
            onCancel={close}
            footer={null}
            closable={false}
            centered
            width={520}
            // Padding via classNames, not styles: an inline padding cannot be made
            // responsive, and 28px left only ~288px of interior on a 360px phone.
            styles={{ content: { borderRadius: 24 } }}
            classNames={{ content: '!p-4 sm:!p-7' }}
        >
            <Flex vertical gap={20}>
                {/* Header */}
                <Flex align="start" justify="space-between">
                    <Flex vertical gap={4} className="pe-4">
                        <Text className="text-[22px] font-semibold text-black">Cancel order</Text>
                        <Text className="text-[14px] text-[#6a7282]">
                            {isPrepaid
                                ? 'Prepaid order — the refund goes back to your original payment method.'
                                : 'The refund, if applicable, will be processed to your original payment method.'}
                        </Text>
                    </Flex>
                    <button
                        type="button"
                        onClick={close}
                        aria-label="Close"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5]"
                    >
                        <CloseOutlined className="text-[#6a7282]" />
                    </button>
                </Flex>

                {/* What do you want to cancel */}
                <Flex vertical gap={8}>
                    <Text className="text-[15px] font-semibold text-black">
                        What do you want to cancel?
                    </Text>
                    {/* min-w-0 + break-words: orderId is a seller-supplied ONDC id, and
                        one with no hyphen to break at overflowed this pill and the
                        modal body on a phone. */}
                    <Flex align="center" gap={10} className="rounded-xl bg-[#f7f7f7] px-4 py-3">
                        <ShoppingOutlined className="shrink-0 text-[#6a7282]" />
                        <Text className="min-w-0 break-words text-[15px] text-[#1e293b]">
                            Entire order · {orderId} ({formatInr(refundAmount)})
                        </Text>
                    </Flex>
                </Flex>

                {/* Reason */}
                <Flex vertical gap={8}>
                    <Text className="text-[15px] font-semibold text-black">
                        Reason for cancellation
                    </Text>
                    <Select
                        size="large"
                        placeholder="Select a reason"
                        value={reason}
                        onChange={setReason}
                        className="w-full"
                        options={CANCEL_REASONS.map(r => ({ label: r, value: r }))}
                    />
                </Flex>

                {/* Description */}
                <Flex vertical gap={8}>
                    <Text className="text-[15px] font-semibold text-black">Description</Text>
                    <TextArea
                        rows={3}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Tell the seller why you're cancelling"
                        className="!rounded-xl"
                    />
                </Flex>

                {/* Refund notice */}
                <Flex align="start" gap={10} className="rounded-xl bg-[#eff6ff] px-4 py-3">
                    <InfoCircleFilled className="mt-0.5 text-[#3b82f6]" />
                    <Text className="text-[14px] text-[#1e3a8a]">
                        {formatInr(refundAmount)} will be refunded to your payment method in 5-7
                        business days.
                    </Text>
                </Flex>

                {/* Actions */}
                <Flex gap={12}>
                    <Button
                        onClick={close}
                        disabled={isSubmitting}
                        className="!h-11 !flex-1 !rounded-lg !font-medium"
                    >
                        Keep order
                    </Button>
                    <Button
                        type="primary"
                        danger
                        disabled={!reason || isSubmitting}
                        loading={isSubmitting}
                        onClick={handleSubmit}
                        className="!h-11 !flex-1 !rounded-lg !font-medium"
                    >
                        Request cancellation
                    </Button>
                </Flex>
            </Flex>
        </Modal>
    );
};

export default CancelOrderModal;
