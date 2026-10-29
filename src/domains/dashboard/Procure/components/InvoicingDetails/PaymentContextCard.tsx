import React from 'react';

import { Card, Flex, Tag, Typography } from 'antd';

import { InvoiceData } from '../../types';

const { Title, Text } = Typography;

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <Flex vertical gap={4}>
        <Text style={{ fontSize: 14, color: '#7d7d7d' }}>{label}</Text>
        {typeof value === 'string'
            ? <Text style={{ fontSize: 16, fontWeight: 500, color: '#000' }}>{value}</Text>
            : value}
    </Flex>
);

interface Props { detail: InvoiceData | null; }

const statusColors: Record<string, { color: string; bg: string }> = {
    Paid:     { color: '#03a254', bg: '#ecfdf5' },
    Pending:  { color: '#fa8c16', bg: '#fff7e6' },
    Failed:   { color: '#f5222d', bg: '#fff1f0' },
};

const PaymentContextCard: React.FC<Props> = ({ detail }) => {
    const rawStatus = detail?.paymentStatus ?? detail?.status;
    const payStatus = rawStatus ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase() : null;
    const cfg = payStatus ? (statusColors[payStatus] ?? { color: '#595959', bg: '#f5f5f5' }) : null;

    return (
         <Card className="rounded-3xl w-full !border-gray-100" styles={{ body: { padding: 32 }  }}>
            <Flex vertical gap={24}>
                <Flex vertical gap={4}>
                    <Title level={4} style={{ margin: 0 }}>Bank Details</Title>
                </Flex>

                <InfoRow label="Vendor" value={detail?.purchaseOrder?.vendor?.businessName ?? '—'} />
                <InfoRow label="Bank" value={detail?.bankName ?? '—'} />
                <InfoRow label="Account Number" value={detail?.accountNumber ?? '—'} />
                <InfoRow label="IFSC Code" value={detail?.ifscCode ?? '—'} />
                <InfoRow
                    label="Current Payment Status"
                    value={cfg && payStatus
                        ? <Tag style={{ background: cfg.bg, color: cfg.color, border: 'none', borderRadius: 20, padding: '2px 10px', width: 'fit-content', margin: 0 }}>{payStatus}</Tag>
                        : '—'
                    }
                />
            </Flex>
        </Card>
    );
};

export default PaymentContextCard;
