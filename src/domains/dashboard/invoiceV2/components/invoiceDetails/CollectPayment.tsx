import { LoadingOutlined } from '@ant-design/icons';
import { Card, Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import { DOMESTIC_METHODS, INTERNATIONAL_METHODS } from '../../constants/invoiceDetails';
import { InvoiceType } from '../../types';
import { CollectPaymentKey } from '../../types/invoiceDetails';

interface CollectPaymentProps {
    invoiceType?: InvoiceType;
    onSelect: (key: CollectPaymentKey) => void;
    loadingMethod?: CollectPaymentKey | null;
}

const CollectPayment = ({
    invoiceType = 'DOMESTIC',
    onSelect,
    loadingMethod,
}: CollectPaymentProps) => {
    const methods = invoiceType === 'INTERNATIONAL' ? INTERNATIONAL_METHODS : DOMESTIC_METHODS;

    return (
        <Card className="w-full rounded-2xl shadow-md">
            <Typography.Text className="text-xl font-semibold">Collect Payment</Typography.Text>
            <Flex wrap gap={12} className="mt-4">
                {methods.map(method => {
                    const isLoading = loadingMethod === method.key;
                    let cardClassName = 'cursor-pointer border-gray-200 hover:border-gray-300';

                    if (method.disabled) {
                        cardClassName = 'cursor-not-allowed opacity-50 border-gray-200';
                    } else if (isLoading) {
                        cardClassName =
                            'cursor-not-allowed border-[#FFD6D6] bg-[#FFF7F7] opacity-80';
                    }

                    return (
                        <Card
                            key={method.key}
                            size="small"
                            onClick={() => !method.disabled && !isLoading && onSelect(method.key)}
                            className={`w-full sm:basis-[calc(50%-6px)] rounded-2xl ${cardClassName}`}
                        >
                            <Flex align="center" justify="space-between" gap={15}>
                                <Flex align="center" gap={15} className="min-w-0">
                                    <Flex
                                        align="center"
                                        justify="center"
                                        className={`w-11 h-11 rounded-xl flex-shrink-0 ${
                                            isLoading ? 'bg-[#FFEAEA]' : method.iconBg
                                        }`}
                                    >
                                        <ReactSVG src={method.icon} />
                                    </Flex>
                                    <Typography.Text className="text-sm font-medium">
                                        {method.label}
                                    </Typography.Text>
                                </Flex>
                                {isLoading && (
                                    <LoadingOutlined
                                        className="text-[#FF4F4F] text-base flex-shrink-0"
                                        spin
                                    />
                                )}
                            </Flex>
                        </Card>
                    );
                })}
            </Flex>
        </Card>
    );
};

export default CollectPayment;
