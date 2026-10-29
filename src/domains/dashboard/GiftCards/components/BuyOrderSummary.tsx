import { RightOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { GiftCardOrderTypes } from '../types/employee';

interface BuyOrderSummaryProps {
    orderType: GiftCardOrderTypes;
    amount: string;
    onEdit: () => void;
}

// Friendlier labels for the collapsed summary row only — the expanded
// order-type buttons keep their original copy so existing tests still match.
const orderTypeSummaryLabels: Record<string, string> = {
    [GiftCardOrderTypes.BUYFORSELF]: 'Buy for Self',
    [GiftCardOrderTypes.BUYFOROTHER]: 'Gift a Friend',
    [GiftCardOrderTypes.BUYFOREMPLOYEE]: 'For Employees',
    [GiftCardOrderTypes.BULKPURCHASE]: 'Bulk Purchase',
};

const BuyOrderSummary = ({ orderType, amount, onEdit }: BuyOrderSummaryProps) => (
    <Flex
        justify="space-between"
        align="center"
        className="bg-white border border-[#f4f4f4] rounded-[2rem] shadow-[0px_2px_16px_1px_rgba(0,0,0,0.06)] px-6 py-5 cursor-pointer"
        onClick={onEdit}
    >
        <Typography.Text className="text-lg font-semibold">
            {orderTypeSummaryLabels[orderType] ?? 'Buy Gift Card'}
        </Typography.Text>
        <Flex align="center" gap={10}>
            <Typography.Text className="text-lg font-semibold">
                ₹ {formatNumberWithLocalString(amount)}
            </Typography.Text>
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brandSurface text-brandPrimary">
                <RightOutlined className="text-xs" />
            </span>
        </Flex>
    </Flex>
);

export default BuyOrderSummary;
