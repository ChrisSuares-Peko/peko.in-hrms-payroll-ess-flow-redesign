import { useEffect, useState } from 'react';

import { CheckCircleFilled } from '@ant-design/icons';
import { Button, Flex, Form, Input, Select, Typography } from 'antd';
import Modal from 'antd/es/modal/Modal';

import useIndianStates from '@hooks/useIndianStates';
import { addressLineRegex } from '@utils/regex';

import cardImage from '../../../assets/cardImage.jpg';
import { useRequestPhysicalCardApi } from '../../../hooks/user/useRequestPhysicalCardApi';
import { formatRupeesDecimal } from '../../../utils/helpers';
import { REQUEST_PHYSICAL_CARD_COPY as C } from '../../../utils/myCardsData';
import { MyCard } from '../../../utils/types';
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

const ADDRESS_MSG = 'Enter a valid address';

type Step = 'form' | 'success';

interface RequestPhysicalCardModalProps {
    open: boolean;
    card: MyCard | null;
    onClose: () => void;
    /** Called after the request is accepted, so the parent can refresh its data. */
    onSuccess?: () => void;
}

interface FormValues {
    reason: string;
    nameOnCard: string;
    fullName: string;
    mobileNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pinCode: string;
}

const RequestPhysicalCardModal = ({
    open,
    card,
    onClose,
    onSuccess,
}: RequestPhysicalCardModalProps) => {
    const [form] = Form.useForm<FormValues>();
    const [step, setStep] = useState<Step>('form');
    const { submitRequestPhysicalCard, isLoading } = useRequestPhysicalCardApi();
    const { stateOptions } = useIndianStates();

    useEffect(() => {
        if (open && card) {
            form.setFieldsValue({
                nameOnCard: card.nameOnCard || card.holder,
            });
        }
    }, [open, card, form]);

    const handleClose = () => {
        setStep('form');
        form.resetFields();
        onClose();
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();
        if (!card) return;
        const res = await submitRequestPhysicalCard({ cardIssuanceId: card.key, ...values });
        if (res) {
            setStep('success');
            onSuccess?.();
        }
    };

    const footerMap: Record<Step, React.ReactNode> = {
        form: (
            <div className="flex flex-col gap-3 pt-4">
                <div className="grid grid-cols-2 gap-3">
                    <Button danger onClick={handleClose} disabled={isLoading}>
                        {C.cancel}
                    </Button>
                    <Button type="primary" danger loading={isLoading} onClick={handleSubmit}>
                        {C.confirmBtn}
                    </Button>
                </div>
                <PineLabsFooter />
            </div>
        ),
        success: null,
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            destroyOnHidden
            centered
            classNames={ROUNDED_MODAL_CLASSNAMES}
            closeIcon={MODAL_CLOSE_ICON}
            width={480}
            title={
                step !== 'success' ? (
                    <div className="flex flex-col gap-1">
                        <Title level={4} className="!mb-0 !text-textHeadings">
                            {C.title}
                        </Title>
                        <Text className="text-sm font-normal text-textBody">
                            A physical companion will be issued for your virtual card after admin
                            approval.
                        </Text>
                    </div>
                ) : null
            }
            footer={footerMap[step]}
        >
            {step === 'form' && (
                <Form form={form} layout="vertical">
                    <div className="mb-4 flex flex-col gap-3">
                        <Text className="text-sm font-semibold text-textHeadings">
                            {C.cardDetails}
                        </Text>
                        <div className="rounded-xl border border-borderCard bg-[#F8FAFC] p-4 flex flex-col gap-3">
                            <div className="flex items-start gap-3">
                                <img
                                    src={cardImage}
                                    alt="card"
                                    className="h-12 w-20 shrink-0 rounded-md object-cover shadow-sm"
                                />
                                <div className="flex flex-1 items-start justify-between gap-3">
                                    <div>
                                        <Text className="block text-sm font-semibold text-textHeadings">
                                            {card?.nameOnCard || card?.holder}
                                        </Text>
                                        <Text className="text-sm text-textBody">
                                            {card?.kind?.split(' ')[0]?.toLowerCase()}{' '}
                                            {card?.maskedCardNumber ??
                                                `**** **** **** ${card?.last4}`}
                                        </Text>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <Text className="block text-xs text-textBody">
                                            Monthly limit
                                        </Text>
                                        <Text className="text-sm font-semibold text-textHeadings">
                                            {formatRupeesDecimal(card?.limit ?? 0)}
                                        </Text>
                                    </div>
                                </div>
                            </div>
                            <Text className="text-sm text-textBody">
                                The physical card will mirror this card&apos;s limits and controls.
                            </Text>
                        </div>
                    </div>

                    <Form.Item
                        name="nameOnCard"
                        label={C.nameOnCard}
                        rules={[
                            { required: true, message: 'Please enter name on card' },
                            ...wsRules('Name on card'),
                        ]}
                        extra={C.nameOnCardHint}
                        className="!mb-4 mt-2"
                    >
                        <Input
                            placeholder="Enter"
                            maxLength={26}
                            onChange={e =>
                                form.setFieldValue(
                                    'nameOnCard',
                                    e.target.value.replace(/[^a-zA-Z\s]/g, '')
                                )
                            }
                        />
                    </Form.Item>

                    <Form.Item
                        name="reason"
                        label="Reason"
                        rules={[
                            {
                                required: true,
                                message: 'Please provide a reason for requesting the physical card',
                            },
                            { min: 10, message: 'Reason must be at least 10 characters' },
                            ...wsRules('Reason'),
                        ]}
                        className="!mb-4"
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder="Why do you need this physical card?"
                            maxLength={250}
                            showCount
                        />
                    </Form.Item>

                    <Text className="mb-2 block text-sm font-semibold text-textHeadings">
                        {C.deliveryAddress}
                    </Text>

                    <Form.Item
                        name="fullName"
                        label={C.fullName}
                        normalize={v => v?.replace(/[^a-zA-Z\s]/g, '')}
                        rules={[
                            { required: true, message: 'Please enter the full name' },
                            { min: 3, message: 'Full name must be at least 3 characters' },
                            ...wsRules('Full name'),
                        ]}
                        className="!mb-3 mt-2"
                    >
                        <Input placeholder="Enter" maxLength={50} />
                    </Form.Item>

                    <Form.Item
                        name="mobileNumber"
                        label={C.mobileNumber}
                        normalize={v => v?.replace(/\D/g, '')}
                        rules={[
                            { required: true, message: 'Please enter the mobile number' },
                            {
                                pattern: /^[6-9]\d{9}$/,
                                message: 'Enter a valid 10-digit Indian mobile number',
                            },
                        ]}
                        className="!mb-3"
                    >
                        <Input inputMode="numeric" maxLength={10} placeholder="Enter" />
                    </Form.Item>

                    <Form.Item
                        name="addressLine1"
                        label={C.addressLine1}
                        rules={[
                            { required: true, message: 'Please enter the address line 1' },
                            { min: 5, message: 'Address line 1 must be at least 5 characters' },
                            { pattern: addressLineRegex, message: ADDRESS_MSG },
                            ...wsRules('Address line 1'),
                        ]}
                        className="!mb-3"
                    >
                        <Input placeholder="Enter" maxLength={100} />
                    </Form.Item>

                    <Form.Item
                        name="addressLine2"
                        label={C.addressLine2}
                        rules={[
                            {
                                validator: (_, value) => {
                                    if (!value) return Promise.resolve();
                                    if (value.trim().length < 5)
                                        return Promise.reject(
                                            new Error(
                                                'Address line 2 must be at least 5 characters'
                                            )
                                        );
                                    return addressLineRegex.test(value)
                                        ? Promise.resolve()
                                        : Promise.reject(new Error(ADDRESS_MSG));
                                },
                            },
                            ...wsRules('Address line 2'),
                        ]}
                        className="!mb-3"
                    >
                        <Input placeholder="Enter" maxLength={100} />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-x-4">
                        <Form.Item
                            name="city"
                            label={C.city}
                            rules={[
                                { required: true, message: 'Please enter the city' },
                                { min: 3, message: 'City must be at least 3 characters' },
                                ...wsRules('City'),
                            ]}
                            className="!mb-3"
                        >
                            <Input placeholder="Enter" maxLength={50} />
                        </Form.Item>
                        <Form.Item
                            name="state"
                            label={C.state}
                            rules={[{ required: true, message: 'Please select the state' }]}
                            className="!mb-3"
                        >
                            <Select
                                showSearch
                                optionFilterProp="label"
                                placeholder="Select"
                                options={stateOptions}
                            />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="pinCode"
                        label={C.pinCode}
                        normalize={v => v?.replace(/\D/g, '')}
                        rules={[
                            { required: true, message: 'Please enter the PIN code' },
                            { pattern: /^\d{6}$/, message: 'Enter a valid 6-digit PIN code' },
                        ]}
                        className="!mb-0"
                    >
                        <Input inputMode="numeric" maxLength={6} placeholder="Enter" />
                    </Form.Item>
                </Form>
            )}

            {step === 'success' && (
                <Flex vertical align="center" gap={24} className="py-6 text-center">
                    <span className="relative flex size-28 items-center justify-center rounded-full bg-savingsTagLightBg/30">
                        <span className="absolute size-20 rounded-full bg-savingsTagLightBg/60" />
                        <span className="relative flex size-12 items-center justify-center rounded-full bg-savingsTagLightText">
                            <CheckCircleFilled className="text-2xl text-white" />
                        </span>
                    </span>
                    <Flex vertical gap={8}>
                        <Title level={4} className="!mb-0 !text-textHeadings">
                            {C.successTitle}
                        </Title>
                        <Text className="text-sm text-textBody">{C.successMessage}</Text>
                    </Flex>
                    <PineLabsFooter />
                </Flex>
            )}
        </Modal>
    );
};

export default RequestPhysicalCardModal;
