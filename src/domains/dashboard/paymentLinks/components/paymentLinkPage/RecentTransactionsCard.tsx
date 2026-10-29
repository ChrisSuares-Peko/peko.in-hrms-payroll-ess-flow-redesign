import { Card, Flex, Skeleton, Tag, Typography } from 'antd';

import { DashboardData } from '../../types/paymentLinkTypes';
import { getStatusColor, getStatusLabel } from '../../utils/data';

interface RecentTransactionsCardProps {
    transactions: DashboardData['transactions'];
    isLoading: boolean;
    onViewAll: () => void;
}

const RecentTransactionsCard = ({
    transactions,
    isLoading,
    onViewAll,
}: RecentTransactionsCardProps) => {
    const renderTransactions = () => {
        if (isLoading) {
            return (
                <Flex vertical gap={12}>
                    {[1, 2, 3, 4].map(item => (
                        <Skeleton.Button
                            key={item}
                            active
                            block
                            size="small"
                            className="!h-[58px]"
                        />
                    ))}
                </Flex>
            );
        }

        if (transactions.length === 0) {
            return (
                <Typography.Text className="text-gray-400 text-center py-8">
                    No transactions yet
                </Typography.Text>
            );
        }

        return (
            <Flex vertical gap={10}>
                {transactions.map((tx, idx) => (
                    <Flex
                        key={tx.decentro_txn_id || `${tx.reference_id}-${idx}`}
                        vertical
                        gap={4}
                        className="py-3 border-b bg-white px-3 rounded-xl border-gray-100 last:border-0"
                    >
                        <Flex justify="space-between" align="center">
                            <Typography.Text className="font-medium text-sm">
                                {tx.customerName || 'N/A'}
                            </Typography.Text>
                            <Typography.Text className="font-semibold text-sm">
                            ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography.Text>
                        </Flex>
                        <Flex justify="space-between" align="center">
                            <Typography.Text className="text-gray-400 text-xs">
                                {(() => {
                                    const date = new Date(tx.createdAt);
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const month = date.toLocaleString(undefined, { month: 'long' });
                                    const year = date.getFullYear();
                                    const hour = String(date.getHours()).padStart(2, '0');
                                    const minute = String(date.getMinutes()).padStart(2, '0');
                                    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';

                                    return `${hour}:${minute} ${ampm} · ${day} ${month} ${year}`;
                                })()}
                            </Typography.Text>
                            <Tag color={getStatusColor(tx.status)} className="!m-0 rounded-xl text-xs">
                                {getStatusLabel(tx.status)}
                            </Tag>
                        </Flex>
                    </Flex>
                ))}
            </Flex>
        );
    };

    return (
        <Card className="rounded-xl h-full bg-[#F9F9F9] !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]" bordered={false}>
            <Flex vertical gap={16}>
                <Flex justify="space-between" align="center">
                    <Typography.Text className="font-semibold text-base">
                        Recent Transactions
                    </Typography.Text>
                    <Typography.Text
                        style={{ color: '#FF3A3A' }}
                        className="cursor-pointer text-sm"
                        onClick={onViewAll}
                    >
                        View all
                    </Typography.Text>
                </Flex>
                {renderTransactions()}
            </Flex>
        </Card>
    );
};

export default RecentTransactionsCard;
