import { Flex, Typography } from 'antd';

const ReceiptRow = ({
    label,
    value,
    bold,
    valueColor,
    align = 'center',
    valueClassName,
}: {
    label: string;
    value: string;
    bold?: boolean;
    valueColor?: string;
    align?: 'center' | 'flex-start';
    valueClassName?: string;
}) => (
    <Flex justify="space-between" align={align} gap={8}>
        <Typography.Text
            className={`text-xs leading-5 shrink-0 ${bold ? 'text-gray-600 font-bold' : 'text-neutral-400 font-medium'}`}
        >
            {label}
        </Typography.Text>
        <Typography.Text
            className={`text-xs leading-5 font-semibold text-right ${valueColor ?? 'text-gray-600'} ${valueClassName ?? ''}`}
        >
            {value}
        </Typography.Text>
    </Flex>
);

export default ReceiptRow;
