import { useMemo } from 'react';

import { Button, Form, Input, Modal, Select, Typography } from 'antd';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { useCardsApi } from '../../../hooks/user/useCardsApi';
import { useLimitIncreaseApi } from '../../../hooks/user/useLimitIncreaseApi';
import { LIMIT_INCREASE_COPY as C } from '../../../utils/myCardsData';
import {
    MODAL_CLOSE_ICON,
    PineLabsFooter,
    ROUNDED_MODAL_CLASSNAMES,
} from '../../common/modalProps';

const { Text } = Typography;

const wsRules = (label: string) => [
    {
        validator: (_: unknown, value: string) => {
            if (!value) return Promise.resolve();
            if (/^\s/.test(value))
                return Promise.reject(new Error(`${label} cannot start with a space`));
            if (/\s{2,}/.test(value))
                return Promise.reject(new Error(`${label} cannot contain consecutive spaces`));
            if (/^\s*$/.test(value))
                return Promise.reject(new Error(`${label} cannot be only spaces`));
            return Promise.resolve();
        },
    },
];

const reasonRules = [
    {
        validator: (_: unknown, value: string) => {
            if (!value || !value.trim()) return Promise.resolve();
            if (value.trim().length < 10)
                return Promise.reject(new Error('Reason must be at least 10 characters'));
            return Promise.resolve();
        },
    },
    ...wsRules('Reason'),
];

interface RequestTopupModalProps {
    open: boolean;
    onClose: () => void;
    /** Called after a request is accepted, so the parent can refresh its list. */
    onSuccess?: () => void;
}

interface TopupForm {
    card: string;
    amount: string;
    reason?: string;
}

/**
 * "Request a card top-up" — a LIMIT_INCREASE request on a card the cardholder picks. Unlike LimitIncreaseModal
 * (opened from a single card), this is the standalone entry from the My Requests page, so it lists the user's
 * real cards to choose from.
 */
const RequestTopupModal = ({ open, onClose, onSuccess }: RequestTopupModalProps) => {
    const [form] = Form.useForm<TopupForm>();
    const dispatch = useAppDispatch();
    const { cards, isLoading: cardsLoading } = useCardsApi();
    const { submitLimitIncrease, isLoading } = useLimitIncreaseApi();

    const cardOptions = useMemo(
        () =>
            cards
                .filter(card => !card.terminationRequested)
                .map(card => ({ label: `${card.kind} · **** ${card.last4}`, value: card.key })),
        [cards]
    );

    const handleClose = () => {
        form.resetFields();
        onClose();
    };

    const handleFinish = async (values: TopupForm) => {
        const res = await submitLimitIncrease({
            cardIssuanceId: values.card,
            amount: Number(values.amount),
            reason: values.reason?.trim() || undefined,
        });
        if (res) {
            dispatch(
                showToast({
                    variant: 'success',
                    description: res.message || 'Top-up request submitted for review.',
                })
            );
            onSuccess?.();
            handleClose();
        }
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            destroyOnHidden
            centered
            classNames={ROUNDED_MODAL_CLASSNAMES}
            closeIcon={MODAL_CLOSE_ICON}
            width={520}
            title={C.title}
            footer={
                <div className="mt-3 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        <Button danger onClick={handleClose} disabled={isLoading}>
                            {C.cancel}
                        </Button>
                        <Button
                            type="primary"
                            danger
                            loading={isLoading}
                            onClick={() => form.submit()}
                        >
                            {C.submit}
                        </Button>
                    </div>
                    <PineLabsFooter />
                </div>
            }
        >
            <div className="flex flex-col gap-1 mb-4">
                <Text className="text-sm text-textBody">{C.subtitle}</Text>
            </div>

            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Form.Item
                    name="card"
                    label="Card"
                    rules={[{ required: true, message: 'Please select the card' }]}
                >
                    <Select
                        placeholder="Select"
                        options={cardOptions}
                        loading={cardsLoading}
                        notFoundContent={cardsLoading ? 'Loading…' : 'No cards available'}
                    />
                </Form.Item>

                <Form.Item
                    name="amount"
                    label={C.amount}
                    normalize={value => value?.replace(/\D/g, '')}
                    rules={[
                        { required: true, message: 'Please enter the amount' },
                        {
                            validator: (_, value: string) =>
                                !value || Number(value) > 0
                                    ? Promise.resolve()
                                    : Promise.reject(new Error('Amount must be greater than 0')),
                        },
                    ]}
                >
                    <Input inputMode="numeric" placeholder={C.amountPlaceholder} maxLength={10} />
                </Form.Item>

                <Form.Item name="reason" label={C.reason} rules={reasonRules} className="!mb-0">
                    <Input.TextArea
                        rows={3}
                        placeholder={C.reasonPlaceholder}
                        maxLength={500}
                        showCount
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default RequestTopupModal;
