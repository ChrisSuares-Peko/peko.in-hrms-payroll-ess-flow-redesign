import { Flex, Typography } from 'antd';

interface TransactionSettlementCardProps {
    paymentAmount: string;
    transactionCharges: string;
    settlementAmount: string;
    settlementUtr?: string;
    settledDate?: string;
}

const TransactionSettlementCard = ({
    paymentAmount,
    transactionCharges,
    settlementAmount,
    settlementUtr,
    settledDate,
}: TransactionSettlementCardProps) => (
    <div className="rounded-2xl p-5 !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
        <Flex vertical gap={16}>
            <Typography.Text className="font-bold text-base">Settlement Details</Typography.Text>
            <Flex vertical gap={12}>
                <Flex justify="space-between">
                    <Typography.Text className="text-gray-500 text-sm">Payment Amount</Typography.Text>
                    <Typography.Text className="text-sm">{paymentAmount}</Typography.Text>
                </Flex>
                <Flex justify="space-between">
                    <Typography.Text className="text-gray-500 text-sm">Transaction Charges</Typography.Text>
                    <Typography.Text className="text-sm">{transactionCharges}</Typography.Text>
                </Flex>
                <div className="border-t border-gray-200 pt-3">
                    <Flex justify="space-between">
                        <Typography.Text className="font-semibold text-sm">Settlement Amount</Typography.Text>
                        <Typography.Text className="font-semibold text-sm">{settlementAmount}</Typography.Text>
                    </Flex>
                </div>
                <Flex justify="space-between">
                    <Typography.Text className="text-gray-500 text-sm">Settlement UTR</Typography.Text>
                    <Typography.Text className="text-sm">{settlementUtr || '—'}</Typography.Text>
                </Flex>
                <Flex justify="space-between">
                    <Typography.Text className="text-gray-500 text-sm">Settled On</Typography.Text>
                    <Typography.Text className="text-sm">{settledDate || '—'}</Typography.Text>
                </Flex>
            </Flex>
        </Flex>
    </div>
);

export default TransactionSettlementCard;
