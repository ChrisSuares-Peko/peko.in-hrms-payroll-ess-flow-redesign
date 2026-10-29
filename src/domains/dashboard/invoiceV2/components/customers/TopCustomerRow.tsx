import React from 'react';

import { Flex, Typography } from 'antd';

import { TopCustomerBase } from '../../types/customer';
import { formatAmount } from '../../utils/helperFunctions';

type RevenueVariant = TopCustomerBase & { variant: 'revenue' };
type TxnVariant = TopCustomerBase & { variant: 'txn' };
type TopCustomerRowProps = RevenueVariant | TxnVariant;

const TopCustomerRow: React.FC<TopCustomerRowProps> = props => {
    const { variant, rank, name } = props;
    const isRevenue = variant === 'revenue';
    const r = props as RevenueVariant;
    const t = props as TxnVariant;

    const badgeBgClass = isRevenue ? 'bg-[#ECFDF5]' : 'bg-[#F2F7FB]';
    const badgeColorClass = isRevenue ? 'text-[#43B75D]' : 'text-[#2B5678]';
    const primaryRightClass = isRevenue ? 'text-[#1E293B]' : 'text-[#038E36]';
    const secondaryRightClass = isRevenue ? 'text-[#43B75D]' : 'text-[#A1A1AA]';

    const secondaryText = isRevenue
        ? `${r.transactionCount} transactions`
        : formatAmount(t?.totalRevenue || 0);
    const primaryRight = isRevenue
        ? formatAmount(r?.totalRevenue || 0)
        : `${t.transactionCount} orders`;
    const changePercent = r.changePercent ?? 0;
    const percentOfTotal = t.percentOfTotal ?? 0;
    const secondaryRight = isRevenue
        ? `${changePercent > 0 ? '+' : ''}${changePercent}%`
        : `${percentOfTotal > 0 ? '+' : ''}${percentOfTotal}% of total`;

    return (
        <div className="flex items-center justify-between gap-2 sm:gap-3 bg-white rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 min-w-0">
            <Flex align="center" gap={8} className="min-w-0 flex-1">
                <Flex
                    align="center"
                    justify="center"
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 ${badgeBgClass}`}
                >
                    <Typography.Text
                        className={`text-xs sm:text-sm font-semibold ${badgeColorClass}`}
                    >
                        #{rank}
                    </Typography.Text>
                </Flex>
                <Flex vertical gap={2} className="min-w-0">
                    <Typography.Text className="text-[#101828] text-xs sm:text-sm font-medium block whitespace-nowrap">
                        {name}
                    </Typography.Text>
                    <Typography.Text className="text-[#A1A1AA] text-[10px] sm:text-xs font-normal block whitespace-nowrap">
                        {secondaryText}
                    </Typography.Text>
                </Flex>
            </Flex>
            <Flex vertical align="flex-end" gap={2} className="flex-shrink-0">
                <Typography.Text
                    className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${primaryRightClass}`}
                >
                    {primaryRight}
                </Typography.Text>
                <Typography.Text
                    className={`text-[10px] sm:text-xs font-normal whitespace-nowrap ${secondaryRightClass}`}
                >
                    {secondaryRight}
                </Typography.Text>
            </Flex>
        </div>
    );
};

export default React.memo(TopCustomerRow);
