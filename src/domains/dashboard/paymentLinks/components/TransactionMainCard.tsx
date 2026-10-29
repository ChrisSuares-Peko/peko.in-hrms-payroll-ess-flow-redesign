import { CopyOutlined } from '@ant-design/icons';
import { Col, Flex, Row, Typography } from 'antd';

import { TransactionData } from './transactionDetailData';

interface TransactionMainCardProps {
    txn: TransactionData;
    onCopy: (val: string, label: string) => void;
}

const TransactionMainCard = ({ txn, onCopy }: TransactionMainCardProps) => (
    <div className="rounded-2xl p-5 !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
        <Flex vertical gap={20}>
            {/* Status + amount row */}
            <Flex justify="space-between" align="flex-start" wrap="wrap" gap={8}>
                <Flex vertical gap={2}>
                    <Typography.Text className="font-bold text-lg" >
                        Payment {txn.status}
                    </Typography.Text>
                    <Typography.Text className="text-gray-400 text-sm">{txn.dateTime}</Typography.Text>
                </Flex>
                <Flex vertical gap={2} align="flex-start">
                    <Typography.Text className="text-gray-400 text-sm">Amount Paid</Typography.Text>
                    <Typography.Text className="font-bold text-sm">{txn.amount}</Typography.Text>
                </Flex>
            </Flex>

            {/* Details grid */}
            <div className="rounded-xl p-4 !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
                <Row gutter={[12, 12]}>
                    <Col xs={24} sm={12}>
                        <Flex vertical gap={2} className="bg-gray-100 rounded-xl p-3 h-full">
                            <Typography.Text className="text-gray-400 text-xs">Transaction ID</Typography.Text>
                            <Flex align="center" gap={6}>
                                <Typography.Text className="font-semibold text-xs">{txn.transactionId}</Typography.Text>
                                <CopyOutlined
                                    style={{ color: '#9CA3AF', fontSize: 13 }}
                                    className="cursor-pointer hover:text-gray-600"
                                    onClick={() => onCopy(txn.transactionId, 'Transaction ID')}
                                />
                            </Flex>
                        </Flex>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Flex vertical gap={2} className="bg-gray-100 rounded-xl p-3 h-full">
                            <Typography.Text className="text-gray-400 text-xs">Payment Link</Typography.Text>
                            <Flex align="center" gap={6}>
                                <Typography.Text className="font-semibold text-xs">{txn.paymentLink || "-"}</Typography.Text>
                                <CopyOutlined
                                    style={{ color: '#9CA3AF', fontSize: 13 }}
                                    className="cursor-pointer hover:text-gray-600"
                                    onClick={() => onCopy(txn.paymentLink, 'Payment Link')}
                                />
                            </Flex>
                        </Flex>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Flex vertical gap={2} className="bg-gray-100 rounded-xl p-3 h-full">
                            <Typography.Text className="text-gray-400 text-xs">Reference</Typography.Text>
                            <Typography.Text className="font-semibold text-sm">{txn.reference}</Typography.Text>
                        </Flex>
                    </Col>
                </Row>
            </div>

            {/* Customer Details */}
            <Flex vertical gap={12}>
                <Typography.Text className="font-bold text-sm">Customer Details</Typography.Text>
                <div className="rounded-xl p-4 !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
                    <Flex gap={10} wrap="wrap">
                        <Flex
                            vertical
                            gap={2}
                            className="bg-gray-100 p-3 rounded-xl"
                            style={{ flex: 1, minWidth: 200 }}
                        >
                            <Typography.Text className="text-gray-400 text-xs">Name</Typography.Text>
                            <Typography.Text className="font-semibold text-sm">{txn.customerName}</Typography.Text>
                        </Flex>
                        <Flex
                            vertical
                            gap={2}
                            className="bg-gray-100 p-3 rounded-xl"
                            style={{ flex: 1, minWidth: 200 }}
                        >
                            <Typography.Text className="text-gray-400 text-xs">Phone Number</Typography.Text>
                            <Typography.Text className="font-semibold text-sm">{txn.customerPhone}</Typography.Text>
                        </Flex>
                    </Flex>
                </div>
            </Flex>
        </Flex>
    </div>
);

export default TransactionMainCard;
