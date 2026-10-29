import { useState } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Select, Typography } from 'antd';

import useIndianStates from '@hooks/useIndianStates';
import { useAppSelector } from '@src/hooks/store';
import { addressLineRegex } from '@utils/regex';

import { issuePhysicalCardByAdmin } from '../../api/admin/issueCardApi';
import cardImage from '../../assets/cardImage.jpg';
import { usePhysicalCardPurchase } from '../../hooks/admin/usePhysicalCardPurchase';
import { useCardQuotaApi } from '../../hooks/user/useCardQuotaApi';
import {
    isPhysicalCardPurchase,
    physicalCardBlockReason,
    physicalCardPriceNote,
} from '../../utils/cardQuotaData';
import { formatRupeesDecimal } from '../../utils/helpers';
import { REQUEST_PHYSICAL_CARD_COPY as C } from '../../utils/requestPhysicalCardData';
import { MODAL_CLOSE_ICON, PineLabsFooter } from '../common/modalProps';
import SuccessCheck from '../common/SuccessCheck';

const { Title, Text } = Typography;

interface RequestPhysicalCardModalProps {
    open: boolean;
    onClose: () => void;
    holderName: string;
    cardIssuanceId: string;
    last4: string;
    maskedCardNumber?: string;
    cardLimit: number;
    cardType?: string;
}

interface DeliveryForm {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pinCode: string;
    mobileNumber: string;
}

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

const onlyDigits = (value: string) => value.replace(/\D/g, '');

/** 2-step "Request Physical Card" modal: delivery form → success. */
const RequestPhysicalCardModal = ({
    open,
    onClose,
    holderName,
    cardIssuanceId,
    last4,
    maskedCardNumber,
    cardLimit,
    cardType = 'virtual',
}: RequestPhysicalCardModalProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { stateOptions } = useIndianStates();
    const { quota, isLoading: isQuotaLoading } = useCardQuotaApi();
    const { startPurchase, isPreparing } = usePhysicalCardPurchase();
    const priceNote = physicalCardPriceNote(quota, 'admin');
    const blockReason = physicalCardBlockReason(quota, 'admin');
    const noticeTone = (blocked: string, priced: string, plain: string) => {
        if (blockReason) return blocked;
        return priceNote ? priced : plain;
    };
    const [form] = Form.useForm<DeliveryForm>();
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [isLoading, setIsLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(true);

    const handleClose = () => {
        form.resetFields();
        setStep('form');
        setConfirmed(true);
        onClose();
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const delivery = {
                nameOnCard: holderName,
                fullName: holderName,
                mobileNumber: values.mobileNumber,
                addressLine1: values.addressLine1,
                ...(values.addressLine2 ? { addressLine2: values.addressLine2 } : {}),
                city: values.city,
                state: values.state,
                pinCode: values.pinCode,
            };

            // The plan's free cards are used up, so this one is bought before it is ordered. The delivery
            // details travel with the payment and come back to the server on confirmation.
            if (quota && isPhysicalCardPurchase(quota)) {
                await startPurchase({ cardIssuanceId, holderName, delivery });
                return;
            }

            setIsLoading(true);
            const res = await issuePhysicalCardByAdmin(role, id, cardIssuanceId, delivery);
            setIsLoading(false);
            if (res) {
                setConfirmed(res.data?.confirmed !== false);
                setStep('success');
            }
        } catch {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            centered
            width={480}
            destroyOnHidden
            classNames={{ content: '!rounded-[32px]' }}
            closeIcon={step === 'success' ? null : MODAL_CLOSE_ICON}
        >
            {step === 'success' ? (
                <div className="flex flex-col items-center gap-5 py-2 text-center">
                    <SuccessCheck />
                    <div className="flex flex-col gap-2">
                        <Title level={4} className="!mb-0 !text-textHeadings">
                            {confirmed ? C.successTitle : C.pendingTitle}
                        </Title>
                        <Text className="text-sm text-textBody">
                            {confirmed ? C.successMessage : C.pendingMessage}
                        </Text>
                    </div>
                    <PineLabsFooter />
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <Title level={4} className="!mb-0 !text-textHeadings">
                            {C.title}
                        </Title>
                        <Text className="text-sm text-textBody">{C.subtitle}</Text>
                    </div>

                    <Form form={form} layout="vertical" requiredMark={false}>
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-3">
                                <Text className="text-sm font-semibold text-textHeadings">
                                    Card Details
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
                                                    {holderName}
                                                </Text>
                                                <Text className="text-sm text-textBody">
                                                    {cardType}{' '}
                                                    {maskedCardNumber ?? `**** **** **** ${last4}`}
                                                </Text>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <Text className="block text-xs text-textBody">
                                                    Monthly limit
                                                </Text>
                                                <Text className="text-sm font-semibold text-textHeadings">
                                                    {formatRupeesDecimal(cardLimit)}
                                                </Text>
                                            </div>
                                        </div>
                                    </div>
                                    <Text className="text-sm text-textBody">
                                        This name will be the same as your virtual card. The
                                        physical card will mirror this card&apos;s limits and
                                        controls.
                                    </Text>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Text className="text-base font-semibold text-textHeadings">
                                    Delivery Address
                                </Text>

                                <Form.Item
                                    name="addressLine1"
                                    label={
                                        <span>
                                            Address Line 1
                                            <span className="ml-0.5 text-errorTextRed">*</span>
                                        </span>
                                    }
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Please enter the address line 1',
                                        },
                                        {
                                            pattern: addressLineRegex,
                                            message: 'Enter a valid address',
                                        },
                                        ...wsRules('Address line 1'),
                                    ]}
                                    className="!mb-0"
                                >
                                    <Input placeholder="Enter" maxLength={100} />
                                </Form.Item>

                                <Form.Item
                                    name="addressLine2"
                                    label="Address Line 2 (Optional)"
                                    rules={[
                                        {
                                            validator: (_, value) =>
                                                !value || addressLineRegex.test(value)
                                                    ? Promise.resolve()
                                                    : Promise.reject(
                                                          new Error('Enter a valid address')
                                                      ),
                                        },
                                        ...wsRules('Address line 2'),
                                    ]}
                                    className="!mb-0"
                                >
                                    <Input placeholder="Enter" maxLength={100} />
                                </Form.Item>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Form.Item
                                        name="city"
                                        label={
                                            <span>
                                                City
                                                <span className="ml-0.5 text-errorTextRed">*</span>
                                            </span>
                                        }
                                        rules={[
                                            { required: true, message: 'Please enter the city' },
                                            ...wsRules('City'),
                                        ]}
                                        className="!mb-0"
                                    >
                                        <Input placeholder="Enter" />
                                    </Form.Item>
                                    <Form.Item
                                        name="state"
                                        label={
                                            <span>
                                                State
                                                <span className="ml-0.5 text-errorTextRed">*</span>
                                            </span>
                                        }
                                        rules={[
                                            { required: true, message: 'Please select the state' },
                                        ]}
                                        className="!mb-0"
                                    >
                                        <Select
                                            showSearch
                                            allowClear
                                            optionFilterProp="label"
                                            placeholder="Select"
                                            options={stateOptions}
                                            className="w-full"
                                        />
                                    </Form.Item>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Form.Item
                                        name="pinCode"
                                        label={
                                            <span>
                                                PIN Code
                                                <span className="ml-0.5 text-errorTextRed">*</span>
                                            </span>
                                        }
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Please enter the PIN code',
                                            },
                                            {
                                                pattern: /^\d{6}$/,
                                                message: 'Enter a valid 6-digit PIN code',
                                            },
                                        ]}
                                        className="!mb-0"
                                    >
                                        <Input
                                            inputMode="numeric"
                                            maxLength={6}
                                            placeholder="Enter"
                                            onChange={e =>
                                                form.setFieldValue(
                                                    'pinCode',
                                                    onlyDigits(e.target.value)
                                                )
                                            }
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name="mobileNumber"
                                        label={
                                            <span>
                                                Mobile Number
                                                <span className="ml-0.5 text-errorTextRed">*</span>
                                            </span>
                                        }
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Please enter the mobile number',
                                            },
                                            {
                                                pattern: /^[6-9]\d{9}$/,
                                                message: 'Enter a valid 10-digit mobile number',
                                            },
                                        ]}
                                        className="!mb-0"
                                    >
                                        <Input
                                            inputMode="numeric"
                                            maxLength={10}
                                            placeholder="Enter"
                                            onChange={e =>
                                                form.setFieldValue(
                                                    'mobileNumber',
                                                    onlyDigits(e.target.value)
                                                )
                                            }
                                        />
                                    </Form.Item>
                                </div>
                            </div>
                        </div>
                    </Form>

                    {(priceNote || blockReason || quota) && (
                        <div
                            className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${noticeTone(
                                'border-errorTextRed/30 bg-bgLightPink',
                                'border-textOrange/30 bg-bgOrangeShade',
                                'border-savingsTagLightText/30 bg-savingsTagLightBg'
                            )}`}
                        >
                            <InfoCircleOutlined
                                className={noticeTone(
                                    'text-errorTextRed',
                                    'text-textOrange',
                                    'text-savingsTagLightText'
                                )}
                            />
                            <Text className="text-sm text-textBody">
                                {blockReason ||
                                    priceNote ||
                                    `${quota?.remaining ?? 0} of ${quota?.allowed ?? 0} physical cards remaining on your plan.`}
                            </Text>
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Button danger onClick={handleClose} className="font-medium">
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleSubmit}
                                loading={isLoading || isPreparing}
                                // Until the allowance is known the order could silently take the free path.
                                disabled={!!blockReason || isQuotaLoading}
                                className="font-medium"
                            >
                                {priceNote
                                    ? `Pay ${formatRupeesDecimal(quota?.unitPrice ?? 0)} + GST & order`
                                    : 'Confirm & order'}
                            </Button>
                        </div>
                        <PineLabsFooter />
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default RequestPhysicalCardModal;
