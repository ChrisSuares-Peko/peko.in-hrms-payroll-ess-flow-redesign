import { InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Tooltip, Typography } from 'antd';

import { parseAmount } from '@utils/priceFormat';

type PriceAfterDiscountProps = {
    price: unknown;
    discount?: unknown;
    format?: (amount: number) => string;
};

type CustomerPaysRowProps = {
    label: string;
    price: unknown;
    discount?: unknown;
    className?: string;
    info?: string;
};

const rupees = (amount: number) => `₹ ${amount.toFixed(2)}`;

const split = (price: unknown, discount?: unknown) => {
    const full = Math.max(parseAmount(price), 0);
    const off = Math.min(Math.max(parseAmount(discount), 0), full);
    return { full, off, payable: full - off };
};

const PriceAfterDiscount = ({ price, discount, format = rupees }: PriceAfterDiscountProps) => {
    const { full, off, payable } = split(price, discount);

    if (!off) return <Typography.Text>{format(full)}</Typography.Text>;

    return (
        <Flex vertical>
            <Typography.Text delete type="secondary" className="text-xs">
                {format(full)}
            </Typography.Text>
            <Typography.Text strong>{format(payable)}</Typography.Text>
        </Flex>
    );
};

export const CustomerPaysRow = ({
    label,
    price,
    discount,
    className = '-mt-3 mb-5',
    info,
}: CustomerPaysRowProps) => (
    <Flex
        justify="space-between"
        align="center"
        className={`rounded-sm bg-gray-50 px-3 py-2 ${className}`}
    >
        <Flex gap={6} align="center">
            <Typography.Text type="secondary">{label}</Typography.Text>
            {info && (
                <Tooltip title={info}>
                    <InfoCircleOutlined className="cursor-pointer text-gray-400" />
                </Tooltip>
            )}
        </Flex>
        <PriceAfterDiscount price={price} discount={discount} />
    </Flex>
);

export default PriceAfterDiscount;
