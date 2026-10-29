import { Button, Card, Col, Flex, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';

import type { VirtualAccountStatementApiRow } from '@domains/dashboard/paymentLinks/types/paymentLinkTypes';

import { LABEL_COLOR, RED, VALUE_COLOR } from './constants';

const { Text } = Typography;

interface VARecentTransactionsProps {
    rows: VirtualAccountStatementApiRow[];
    isLoading: boolean;
    onViewAll: () => void;
}

const VARecentTransactions = ({ rows, isLoading, onViewAll }: VARecentTransactionsProps) => (
    <Col xs={24} xl={8}>
        <Flex vertical gap={12}>
            <Flex justify="space-between" align="center" gap={12}>
                <Text style={{ fontSize: 16, fontWeight: 700, color: VALUE_COLOR }}>
                    Recent Transactions
                </Text>
                <Button
                    type="link"
                    onClick={onViewAll}
                    style={{ color: RED, fontWeight: 500, padding: 0 }}
                >
                    View all
                </Button>
            </Flex>
            <Flex vertical gap={10}>
                {isLoading && <Skeleton active paragraph={{ rows: 4 }} />}
                {!isLoading && rows.length === 0 && (
                    <Text style={{ color: LABEL_COLOR, fontSize: 13 }}>No recent transactions.</Text>
                )}
                {!isLoading &&
                    rows.length > 0 &&
                    rows.map((row) => {
                        const isCredit = row.type === 'credit';
                        return (
                            <Card
                                key={row.key}
                                size="small"
                                style={{ background: '#f8fafc', border: 'none', borderRadius: 10 }}
                                styles={{ body: { padding: '12px 16px' } }}
                            >
                                <Flex justify="space-between" align="center" gap={12}>
                                    <Flex align="center" gap={10} style={{ minWidth: 0 }}>
                                        <Flex
                                            justify="center"
                                            align="center"
                                            style={{
                                                width: 34,
                                                height: 34,
                                                borderRadius: '50%',
                                                background: isCredit ? '#ecfdf5' : '#fef2f2',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Text style={{ fontSize: 15, color: isCredit ? '#43b75d' : RED, fontWeight: 700 }}>
                                                {isCredit ? '↗' : '↘'}
                                            </Text>
                                        </Flex>
                                        <Flex vertical gap={2} style={{ minWidth: 0 }}>
                                            <Text
                                                style={{ fontSize: 13, fontWeight: 600, color: VALUE_COLOR }}
                                                ellipsis={{ tooltip: row.description || (isCredit ? 'Credited' : 'Debited') }}
                                            >
                                                {row.description || (isCredit ? 'Credited' : 'Debited')}
                                            </Text>
                                            <Text style={{ fontSize: 11, color: LABEL_COLOR, whiteSpace: 'normal' }}>
                                                {row.dateTime
                                                    ? dayjs(row.dateTime).format('hh:mm A · DD MMMM YYYY')
                                                    : '—'}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: isCredit ? '#43b75d' : RED,
                                            marginLeft: 8,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {isCredit ? '+' : '-'}₹{(row.amount ?? 0).toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </Text>
                                </Flex>
                            </Card>
                        );
                    })}
            </Flex>
        </Flex>
    </Col>
);

export default VARecentTransactions;
