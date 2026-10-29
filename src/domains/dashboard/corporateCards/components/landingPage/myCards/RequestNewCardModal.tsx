import { useState } from 'react';

import { CheckCircleFilled } from '@ant-design/icons';
import { Button, Form, Input, Modal, Typography } from 'antd';

import { useIssueCardApi } from '../../../hooks/user/useIssueCardApi';
import { formatRupeesDecimal } from '../../../utils/helpers';
import { REQUEST_NEW_CARD_COPY as C } from '../../../utils/myCardsData';
import {
    MODAL_CLOSE_ICON,
    PineLabsFooter,
    ROUNDED_MODAL_CLASSNAMES,
} from '../../common/modalProps';

const { Title, Text } = Typography;

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

interface RequestNewCardModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface RequestNewCardForm {
    cardLimit: string;
    perTxnLimit?: string;
    reason?: string;
}

const HelperText = ({ children }: { children: string }) => (
    <Text className="text-xs text-textGreyLight">{children}</Text>
);

const StatPair = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-1 rounded-xl border border-borderCard p-4">
        <Text className="text-xs text-textGreyLight">{label}</Text>
        <Text className="text-base font-semibold text-textHeadings">{value}</Text>
    </div>
);

/**
 * Request-a-new-card flow for a cardholder: a short request form that, on submit, swaps to an
 * in-modal "Request Submitted" success screen.
 */
const RequestNewCardModal = ({ open, onClose, onSuccess }: RequestNewCardModalProps) => {
    const [form] = Form.useForm<RequestNewCardForm>();
    const [submitted, setSubmitted] = useState(false);
    const [requestedLimit, setRequestedLimit] = useState(0);
    const { submitIssueCard, isLoading } = useIssueCardApi();

    const handleClose = () => {
        setSubmitted(false);
        form.resetFields();
        onClose();
    };

    const handleFinish = async (values: RequestNewCardForm) => {
        const cardLimit = Number(values.cardLimit);
        const res = await submitIssueCard({
            cardType: 'Virtual',
            cardLimit,
            ...(values.perTxnLimit ? { perTxnLimit: Number(values.perTxnLimit) } : {}),
            reason: values.reason?.trim() || undefined,
        });
        if (res) {
            setRequestedLimit(cardLimit);
            setSubmitted(true);
            onSuccess?.();
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
            width={submitted ? 640 : 560}
            title={submitted ? null : C.title}
            footer={
                <div className="mt-6 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        {submitted ? (
                            <Button
                                type="primary"
                                danger
                                className="col-span-2"
                                onClick={handleClose}
                            >
                                {C.done}
                            </Button>
                        ) : (
                            <>
                                <Button danger onClick={handleClose}>
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
                            </>
                        )}
                    </div>
                    <PineLabsFooter />
                </div>
            }
        >
            {submitted ? (
                <div className="flex flex-col items-center gap-6 py-2 text-center">
                    <span className="flex size-16 items-center justify-center rounded-full bg-savingsTagLightBg">
                        <CheckCircleFilled className="text-5xl text-savingsTagLightText" />
                    </span>
                    <div className="flex flex-col gap-1">
                        <Title level={4} className="!mb-0 !text-textHeadings">
                            {C.successTitle}
                        </Title>
                        <Text className="text-sm text-textBody">{C.successMessage}</Text>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-3">
                        <StatPair
                            label={C.detailCardLimit}
                            value={formatRupeesDecimal(requestedLimit)}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    <Text className="text-sm text-textBody">{C.subtitle}</Text>

                    <Form form={form} layout="vertical" onFinish={handleFinish}>
                        <Form.Item label={C.cardType}>
                            <Input value={C.defaultCardType} disabled />
                        </Form.Item>

                        <Form.Item
                            name="cardLimit"
                            label={C.cardLimit}
                            normalize={value => value?.replace(/\D/g, '')}
                            extra={<HelperText>{C.cardLimitHint}</HelperText>}
                            rules={[
                                { required: true, message: 'Please enter the card limit' },
                                {
                                    validator: (_, value) => {
                                        if (value && Number(value) === 0) {
                                            return Promise.reject(
                                                new Error('Card limit must be greater than 0')
                                            );
                                        }
                                        return Promise.resolve();
                                    },
                                },
                            ]}
                        >
                            <Input inputMode="numeric" placeholder="Enter" maxLength={10} />
                        </Form.Item>

                        <Form.Item
                            name="perTxnLimit"
                            label={C.perTxnLimit}
                            normalize={value => value?.replace(/\D/g, '')}
                            dependencies={['cardLimit']}
                            extra={<HelperText>{C.perTxnLimitHint}</HelperText>}
                            rules={[
                                {
                                    validator: (_, value) => {
                                        if (!value) return Promise.resolve();
                                        if (Number(value) === 0) {
                                            return Promise.reject(
                                                new Error(
                                                    'Per-transaction limit must be greater than 0'
                                                )
                                            );
                                        }
                                        const cardLimit = form.getFieldValue('cardLimit');
                                        if (cardLimit && Number(value) > Number(cardLimit)) {
                                            return Promise.reject(
                                                new Error(
                                                    'Per-transaction limit cannot exceed the card limit'
                                                )
                                            );
                                        }
                                        return Promise.resolve();
                                    },
                                },
                            ]}
                        >
                            <Input inputMode="numeric" placeholder="Type" maxLength={10} />
                        </Form.Item>

                        <Form.Item
                            name="reason"
                            label={C.reason}
                            rules={wsRules('Reason')}
                            className="!mb-0"
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder={C.reasonPlaceholder}
                                maxLength={500}
                                showCount
                            />
                        </Form.Item>
                    </Form>
                </div>
            )}
        </Modal>
    );
};

export default RequestNewCardModal;
