import React from 'react';

import { QrcodeOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

import useUpiCollect from '../../hooks/collectPayment/useUpiCollect';
import { InvoiceRow } from '../../types/invoice';
import { formatAmount } from '../../utils/helperFunctions';
import CopyableField from '../shared/CopyableField';

type Props = {
    invoice: InvoiceRow | null;
    onSuccess: () => void;
};

const UpiCollect: React.FC<Props> = ({ invoice, onSuccess }) => {
    const { markAsReceived, isLoading } = useUpiCollect();
    return (
        <Flex vertical gap={16}>
            {/* QR Code */}
            <Flex vertical align="center" gap={8}>
                <Typography.Text className="text-xs font-semibold tracking-widest text-[#475569]">
                    SCAN TO PAY
                </Typography.Text>
                <Flex
                    justify="center"
                    align="center"
                    className="border border-[#E2E8F0] rounded-xl p-4"
                >
                    <QrcodeOutlined className="text-[140px] text-[#1e293b]" />
                </Flex>
                <Typography.Text className="text-xs text-gray-400">
                    Scan with any UPI app
                </Typography.Text>
            </Flex>

            {/* UPI ID / VPA */}
            <CopyableField label="UPI ID / VPA" value="payments@yourcompany" />

            {/* Amount to collect */}
            <Flex vertical align="center" gap={4} className="bg-[#F8FAFC] rounded-xl p-4">
                <Typography.Text className="text-xs tracking-widest text-[#475569]">
                    AMOUNT TO COLLECT
                </Typography.Text>
                <Typography.Text className="text-2xl font-medium">
                    {formatAmount(Number(invoice?.amountDue ?? 0))}
                </Typography.Text>
                <Typography.Text className="text-xs text-gray-400">
                    Ref: {invoice?.prefix ? `${invoice.prefix}${invoice.invoiceNumber}` : invoice?.invoiceNumber}
                </Typography.Text>
            </Flex>

            {/* CTA */}
            <Button
                type="primary"
                danger
                block
                loading={isLoading}
                className="h-9 rounded-lg"
                onClick={() => markAsReceived(invoice?.id ?? '', onSuccess)}
            >
                Mark as Received
            </Button>
        </Flex>
    );
};

export default UpiCollect;
