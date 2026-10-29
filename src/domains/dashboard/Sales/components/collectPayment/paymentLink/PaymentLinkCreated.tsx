import React from 'react';

import { CheckOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';
import dayjs from 'dayjs';

import { SendPaymentLinkFormValues } from '../../../types/CollectPayment';
import { formatAmount, shareViaWhatsApp } from '../../../utils/helperFunctions';
import CenteredHeader from '../../shared/CenteredHeader';
import CopyableField from '../../shared/CopyableField';
import SummaryCard from '../../shared/SummaryCard';

type Props = {
    values: SendPaymentLinkFormValues;
    paymentLink: string;
    expiresAt?: string;
    onCreateAnother: () => void;
    title: string;
    subtitle: string;
};

const PaymentLinkCreated: React.FC<Props> = ({
    values,
    paymentLink,
    expiresAt,
    onCreateAnother,
    title,
    subtitle,
}) => {
    const summaryRows = [
        { label: 'Amount', value: formatAmount(Number(values.amount)) },
        { label: 'Customer Name', value: values.customerName ?? 'N/A' },
        ...(expiresAt
            ? [{ label: 'Link Expires at', value: dayjs(expiresAt).format('DD MMM YYYY, hh:mm A') }]
            : []),
    ];

    return (
        <Flex vertical gap={20} className="pt-2">
            <CenteredHeader
                icon={<CheckOutlined className="text-white text-lg" />}
                outerClass="bg-[#E8FAF0]"
                middleClass="bg-[#D1F4E0]"
                innerClass="bg-[#45D483]"
                title={title}
                description={subtitle}
            />
            <CopyableField label="Payment Link" value={paymentLink} />
            <SummaryCard title="Payment Summary" rows={summaryRows} />
            <Flex gap={10}>
                <Button
                    block
                    icon={<WhatsAppOutlined />}
                    className="h-9 rounded-lg border-[#CBD5E1] text-[#27272A] bg-[#F4F4F5]"
                    onClick={() =>
                        shareViaWhatsApp(
                            `Hi ${values.customerName}, here is your payment link: ${paymentLink}`
                        )
                    }
                >
                    WhatsApp
                </Button>
                <Button
                    block
                    className="h-9 rounded-lg border-[#CBD5E1] text-[#475569]"
                    onClick={onCreateAnother}
                >
                    Create another payment link
                </Button>
            </Flex>
        </Flex>
    );
};

export default PaymentLinkCreated;
