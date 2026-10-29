import React from 'react';

import { Flex, Typography } from 'antd';

import { formatAmount } from '../../utils/helperFunctions';

interface RecentInvoiceRowProps {
    name: string;
    date: string;
    amount: number;
    isCredit: boolean;
}

const RecentInvoiceRow: React.FC<RecentInvoiceRowProps> = ({ name, date, amount, isCredit }) => (
    <Flex
        justify="space-between"
        align="center"
        gap={12}
        className="bg-white rounded-xl px-4 py-3 min-w-0"
    >
        <Flex vertical gap={4} className="min-w-0 flex-1">
            <Typography.Text className="text-[#101828] text-base font-normal leading-6 block truncate">
                {name}
            </Typography.Text>
            <Typography.Text className="text-[#A1A1AA] text-[11px] font-normal leading-4 block">
                {date}
            </Typography.Text>
        </Flex>
        <Typography.Text
            className={`text-base font-semibold leading-6 flex-shrink-0 ${isCredit ? 'text-[#E53E3E]' : 'text-[#038E36]'}`}
        >
            {formatAmount(amount)}
        </Typography.Text>
    </Flex>
);

export default React.memo(RecentInvoiceRow);
