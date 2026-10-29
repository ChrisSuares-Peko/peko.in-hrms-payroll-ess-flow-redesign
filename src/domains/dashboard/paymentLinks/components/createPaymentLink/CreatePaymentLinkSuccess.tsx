import { CheckOutlined, CopyOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Input, Typography } from 'antd';
import dayjs from 'dayjs';
import { SiGooglepay, SiPaytm, SiPhonepe } from 'react-icons/si';

import type { FormState } from './CreatePaymentLinkModal.types';

interface CreatePaymentLinkSuccessProps {
    paymentLink: string;
    submittedForm: FormState;
    expiresAt?: string;
    onCopy: () => void;
    onShareWhatsapp: () => void;
    onCreateAnother: () => void;
}

const CreatePaymentLinkSuccess = ({
    paymentLink,
    submittedForm,
    expiresAt,
    onCopy,
    onShareWhatsapp,
    onCreateAnother,
}: CreatePaymentLinkSuccessProps) => {
    const expiresAtLabel = expiresAt ? dayjs(expiresAt).format('DD MMM YYYY, hh:mm A') : '';
    const summaryRows = [
        { label: 'Amount', value: `₹ ${submittedForm.amount}` },
        { label: 'Purpose', value: submittedForm.purposeMessage || '—' },
        { label: 'Customer Name', value: submittedForm.customerName || '—' },
        { label: 'Customer Phone', value: submittedForm.customerPhone || '—' },
        ...(expiresAtLabel ? [{ label: 'Link Expires at', value: expiresAtLabel }] : []),
    ];
    const paymentAppIcons = [
        {
            key: 'gpay',
            label: 'GPay',
            icon: <SiGooglepay size={20} color="#4285F4" />,
        },
        {
            key: 'cred',
            label: 'CRED',
            icon: (
                <Typography.Text className="!mb-0 !text-[10px] !cursor-pointer !font-semibold !tracking-[0.5px] !text-[#FFFFFF]">
                    CRED
                </Typography.Text>
            ),
            background: '#111827',
        },
        {
            key: 'phonepe',
            label: 'PhonePe',
            icon: <SiPhonepe size={18} color="#5F259F" />,
        },
        {
            key: 'paytm',
            label: 'Paytm',
            icon: <SiPaytm size={19} color="#00BAF2" />,
        },
    ];

    return (
        <Flex vertical gap={16}>
            {/* Success icon + heading */}
            <Flex vertical align="center" gap={12} className="py-2">
                <Flex
                    align="center"
                    justify="center"
                    className="h-[70px] w-[70px] rounded-full"
                    style={{ background: '#DCFCE7' }}
                >
                    <Flex
                        align="center"
                        justify="center"
                        className="h-[52px] w-[52px] rounded-full"
                        style={{ background: '#22C55E' }}
                    >
                        <CheckOutlined style={{ color: '#fff', fontSize: 22, fontWeight: 700 }} />
                    </Flex>
                </Flex>
                <Flex vertical align="center" gap={4}>
                    <Typography.Title
                        level={4}
                        className="!mb-0 !text-center !text-[18px] !font-bold !leading-[1.25] !text-[#1F2A44]"
                    >
                        Payment Link Created
                    </Typography.Title>
                    <Typography.Text className="text-center text-[13px] text-[#667085]">
                        Share this link with your customer to collect payment
                    </Typography.Text>
                </Flex>
            </Flex>

            {/* Payment link input */}
            <Card className="rounded-xl border-none shadow-none" styles={{ body: { padding: 0 } }}>
                <Flex vertical gap={8}>
                    <Typography.Text className="text-[13px] font-semibold text-[#1F2A44]">
                        Payment Link
                    </Typography.Text>
                    <Flex gap={3}>
                        <Input
                            value={paymentLink}
                            readOnly
                            className=" !text-[12px]"
                            style={{ flex: 1 }}
                        />
                        <Button
                            type="primary"
                            danger
                            icon={<CopyOutlined />}
                            className="!border-0 "
                            onClick={()=>onCopy()}
                        />
                    </Flex>
                </Flex>
            </Card>

            <Flex vertical gap={8}>
                <Typography.Text className="text-[12px] font-medium text-[#667085]">
                    Pay using
                </Typography.Text>
                <Flex gap={10} wrap="wrap" className="pt-0.5">
                    {paymentAppIcons.map(app => (
                        <button
                            key={app.key}
                            type="button"
                            aria-label={`Copy payment link for ${app.label}`}
                            className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-[10px] border border-[#E4E7EC] bg-transparent transition-colors hover:border-[#D0D5DD] focus:outline-none focus:ring-offset-1"
                            style={{ background: app.background || '#FFFFFF' }}
                            title={`Click to copy ${app.label} link`}
                            onClick={() => onCopy()}
                        >
                            {app.icon}
                        </button>
                    ))}
                </Flex>
            </Flex>

            {/* Payment summary */}
            <Card
                bordered={false}
                className="rounded-xl !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)] mt-3"
                styles={{ body: { padding: '14px 16px' } }}
            >
                <Flex vertical gap={10}>
                    <Typography.Text className="text-[13px] font-semibold text-[#1F2A44]">
                        Payment Summary
                    </Typography.Text>
                    {summaryRows.map(({ label, value }) => (
                        <Flex key={label} justify="space-between" align="center">
                            <Typography.Text className="text-[12px] text-[#667085]">
                                {label}
                            </Typography.Text>
                            <Typography.Text className="text-[12px] font-medium text-[#1F2A44]">
                                {value}
                            </Typography.Text>
                        </Flex>
                    ))}
                </Flex>
            </Card>

            {/* Action buttons */}
            <Flex gap={12}>
                <Button size="large" block icon={<WhatsAppOutlined />} onClick={onShareWhatsapp}>
                    WhatsApp
                </Button>
                <Button size="large" block onClick={onCreateAnother}>
                    Create another payment link
                </Button>
            </Flex>
        </Flex>
    );
};

export default CreatePaymentLinkSuccess;
