import { Card, Flex, Spin, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import { DOMESTIC_METHODS, INTERNATIONAL_METHODS } from '../../constants/documentDetails';
import { CollectPaymentKey } from '../../types/documentDetails';
import { TransactionType } from '../../types/documents';

interface CollectPaymentProps {
    transactionType?: TransactionType;
    onSelect: (key: CollectPaymentKey) => void;
    loadingKey?: CollectPaymentKey | null;
}

const CollectPayment = ({
    transactionType = 'DOMESTIC',
    onSelect,
    loadingKey,
}: CollectPaymentProps) => {
    const methods = transactionType === 'INTERNATIONAL' ? INTERNATIONAL_METHODS : DOMESTIC_METHODS;

    return (
        <Card className="w-full rounded-2xl shadow-md">
            <Typography.Text className="text-xl font-semibold">Collect Payment</Typography.Text>
            <Flex wrap gap={12} className="mt-4">
                {methods.map(method => {
                    const isLoading = loadingKey === method.key;
                    return (
                        <Card
                            key={method.key}
                            size="small"
                            onClick={() => !method.disabled && !loadingKey && onSelect(method.key)}
                            className={`basis-[calc(50%-6px)] rounded-2xl border-gray-200 ${
                                method.disabled || loadingKey
                                    ? 'cursor-not-allowed opacity-50'
                                    : 'cursor-pointer hover:border-gray-300'
                            }`}
                        >
                            <Flex align="center" gap={15}>
                                <Flex
                                    align="center"
                                    justify="center"
                                    className={`w-11 h-11 ${method.iconBg} rounded-xl`}
                                >
                                    {isLoading ? (
                                        <Spin size="small" />
                                    ) : (
                                        <ReactSVG src={method.icon} />
                                    )}
                                </Flex>
                                <Typography.Text className="text-sm font-medium">
                                    {method.label}
                                </Typography.Text>
                            </Flex>
                        </Card>
                    );
                })}
            </Flex>
        </Card>
    );
};

export default CollectPayment;
