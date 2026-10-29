import { CreditCardOutlined, DeleteOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Row, Typography } from 'antd';
import dayjs from 'dayjs';

import type { VirtualAccountDetailsData } from '@domains/dashboard/paymentLinks/types/paymentLinkTypes';

import { CARD_BORDER, LABEL_COLOR, RED, VALUE_COLOR, formatCurrency } from './constants';

const { Text } = Typography;

interface VADetailCardProps {
    accountName: string | null;
    activatedAt: string | null;
    balance: number | null;
    balLoading: boolean;
    fetchBalance: () => void;
    virtualAccountNumber: string | null;
    ifsc: string | null;
    details: VirtualAccountDetailsData | null;
    onEdit: () => void;
    onDelete: () => void;
    onManageFunds: () => void;
}

const VADetailCard = ({
    accountName,
    activatedAt,
    balance,
    balLoading,
    fetchBalance,
    virtualAccountNumber,
    ifsc,
    details,
    onEdit,
    onDelete,
    onManageFunds,
}: VADetailCardProps) => {
    const detailFields = [
        { label: 'Virtual Account Number', value: virtualAccountNumber || '—' },
        { label: 'IFSC Code', value: ifsc || '—' },
        { label: 'Account Type', value: 'Virtual Account' },
        { label: 'Account Category', value: 'Business' },
        { label: 'PAN', value: details?.pan || '—' },
        { label: 'Registered Email', value: details?.email || '—' },
        { label: 'Mobile', value: details?.mobile || '—' },
        { label: 'Address', value: details?.profileAddress ?? details?.address ?? '—' },
    ];

    return (
        <Card style={{ border: CARD_BORDER, borderRadius: 12 }} styles={{ body: { padding: 'clamp(16px, 4vw, 24px)' } }}>
            {/* Header */}
            <Flex justify="space-between" align="flex-start" wrap="wrap" gap={12} style={{ marginBottom: 24 }}>
                <Flex align="center" gap={10} style={{ minWidth: 0 }}>
                    <Flex
                        justify="center"
                        align="center"
                        style={{ width: 40, height: 40, borderRadius: 8, background: '#f1f5f9' }}
                    >
                        <CreditCardOutlined style={{ fontSize: 20, color: '#475569' }} />
                    </Flex>
                    <Flex vertical gap={2} style={{ minWidth: 0 }}>
                        <Text style={{ fontSize: 16, fontWeight: 600, color: VALUE_COLOR }}>
                            Virtual Account
                        </Text>
                        <Text style={{ fontSize: 13, color: LABEL_COLOR, wordBreak: 'break-word' }}>
                            {accountName || '—'}
                            {activatedAt ? ` • Created ${dayjs(activatedAt).format('YYYY-MM-DD')}` : ''}
                        </Text>
                    </Flex>
                </Flex>
                <Flex gap={8} align="center" wrap="wrap" style={{ maxWidth: '100%' }}>
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={onDelete}
                        style={{ borderRadius: 8 }}
                    >
                        Delete
                    </Button>
                    <Button
                        icon={<EditOutlined />}
                        onClick={onEdit}
                        style={{ borderRadius: 8, borderColor: '#e2e8f0', color: VALUE_COLOR }}
                    >
                        Edit
                    </Button>
                    <Button
                        onClick={onManageFunds}
                        style={{ borderRadius: 8, background: RED, borderColor: RED, color: '#fff' }}
                    >
                        Add/Remove funds
                    </Button>
                </Flex>
            </Flex>

            {/* Available balance */}
            <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 24 }}>
                <Flex vertical gap={4}>
                    <Text style={{ fontSize: 12, color: LABEL_COLOR }}>Available Balance</Text>
                    <Text style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 700, color: VALUE_COLOR, lineHeight: 1.2 }}>
                        {balLoading ? '...' : formatCurrency(balance)}
                    </Text>
                </Flex>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchBalance}
                    loading={balLoading}
                    style={{ borderRadius: 8, borderColor: '#e2e8f0', color: LABEL_COLOR }}
                >
                    Refresh balance
                </Button>
            </Flex>

            {/* Detail grid */}
            <Row gutter={[16, 12]}>
                {detailFields.map(({ label, value }) => (
                    <Col key={label} xs={24} md={12}>
                        <Card
                            size="small"
                            style={{ background: '#f8fafc', border: 'none', borderRadius: 8 }}
                            styles={{ body: { padding: '10px 14px' } }}
                        >
                            <Text style={{ fontSize: 12, color: LABEL_COLOR, display: 'block' }}>
                                {label}
                            </Text>
                            <Text style={{ fontSize: 13, fontWeight: 600, color: VALUE_COLOR, display: 'block', wordBreak: 'break-word' }}>
                                {value}
                            </Text>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Card>
    );
};

export default VADetailCard;
