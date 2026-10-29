import { useState } from 'react';

import { Button, Input, Modal, Typography } from 'antd';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { useLimitIncreaseApi } from '../../../hooks/user/useLimitIncreaseApi';
import { formatRupeesDecimal, utilisationPercent } from '../../../utils/helpers';
import { LIMIT_INCREASE_COPY as C } from '../../../utils/myCardsData';
import { MyCard } from '../../../utils/types';
import CardThumb from '../../common/CardThumb';
import {
    MODAL_CLOSE_ICON,
    PineLabsFooter,
    ROUNDED_MODAL_CLASSNAMES,
} from '../../common/modalProps';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface LimitIncreaseModalProps {
    card: MyCard | null;
    onClose: () => void;
    onSuccess?: () => void;
}

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const StatPair = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-0.5">
        <Text className="text-xs text-textGreyLight">{label}</Text>
        <Text className="text-sm font-semibold text-textHeadings">{value}</Text>
    </div>
);

const LimitIncreaseModal = ({ card, onClose, onSuccess }: LimitIncreaseModalProps) => {
    const dispatch = useAppDispatch();
    const { submitLimitIncrease, isLoading } = useLimitIncreaseApi();
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');

    const isAmountValid = !!amount && Number(amount) > 0;
    const isReasonValid =
        reason.trim().length === 0 || (reason.trim().length >= 10 && reason.trim().length <= 250);

    const reset = () => {
        setAmount('');
        setReason('');
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSubmit = async () => {
        if (!card) return;
        const res = await submitLimitIncrease({
            cardIssuanceId: card.key,
            amount: Number(amount),
            reason: reason.trim() || undefined,
        });
        if (res) {
            dispatch(
                showToast({
                    variant: 'success',
                    description: res.message || 'Limit increase request submitted for review.',
                })
            );
            onSuccess?.();
            handleClose();
        }
    };

    return (
        <Modal
            open={card !== null}
            onCancel={handleClose}
            footer={null}
            centered
            width={520}
            destroyOnHidden
            classNames={ROUNDED_MODAL_CLASSNAMES}
            closeIcon={MODAL_CLOSE_ICON}
        >
            {card && (
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                        <Title level={4} className="!mb-0 !text-textHeadings">
                            {C.title}
                        </Title>
                        <Text className="text-sm text-textBody">{C.subtitle}</Text>
                    </div>

                    <div
                        className="flex flex-col gap-4 rounded-2xl border p-4"
                        style={{ background: '#F8FAFC', borderColor: '#ECECEF' }}
                    >
                        <div className="flex items-center gap-3">
                            <CardThumb />
                            <div className="flex flex-col">
                                <Text className="text-sm font-semibold text-textHeadings">
                                    {card.nameOnCard || card.holder}
                                </Text>
                                <Text className="text-xs text-textGreyLight">
                                    {card.kind} · **** {card.last4}
                                </Text>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <StatPair
                                label="Monthly limit"
                                value={formatRupeesDecimal(card.limit)}
                            />
                            <StatPair
                                label="Spent so far"
                                value={`${formatRupeesDecimal(card.used ?? 0)} (${utilisationPercent(card.used ?? 0, card.limit)}%)`}
                            />
                            <StatPair
                                label="Remaining"
                                value={formatRupeesDecimal((card.limit ?? 0) - (card.used ?? 0))}
                            />
                            <StatPair
                                label="Per-txn limit"
                                value={
                                    card.perTxnLimit != null
                                        ? formatRupeesDecimal(card.perTxnLimit)
                                        : '—'
                                }
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Text className="text-sm text-textHeadings">
                            {C.amount}
                            <span className="ml-0.5 text-errorTextRed">*</span>
                        </Text>
                        <Input
                            inputMode="numeric"
                            placeholder={C.amountPlaceholder}
                            value={amount}
                            maxLength={10}
                            onChange={event => setAmount(onlyDigits(event.target.value))}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Text className="text-sm text-textHeadings">{C.reason}</Text>
                        <TextArea
                            rows={4}
                            placeholder={C.reasonPlaceholder}
                            value={reason}
                            onChange={event => setReason(event.target.value)}
                            minLength={10}
                            maxLength={250}
                            showCount
                            status={!isReasonValid && reason.trim().length > 0 ? 'error' : ''}
                            style={{ resize: 'none' }}
                        />
                    </div>

                    <div className="mt-2 flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                danger
                                onClick={handleClose}
                                disabled={isLoading}
                                className="font-medium"
                            >
                                {C.cancel}
                            </Button>
                            <Button
                                type="primary"
                                danger
                                disabled={!isAmountValid || !isReasonValid}
                                loading={isLoading}
                                onClick={handleSubmit}
                                className="font-medium"
                            >
                                {C.submit}
                            </Button>
                        </div>
                        <PineLabsFooter />
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default LimitIncreaseModal;
