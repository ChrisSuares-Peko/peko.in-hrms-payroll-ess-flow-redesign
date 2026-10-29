import React from 'react';

import { Divider, Flex, Typography } from 'antd';

import { formatAmount } from '../../utils/helperFunctions';

interface SummaryRowProps {
    label: string;
    amount?: string;
    children?: React.ReactNode;
}

const SummaryRow = ({ label, amount, children }: SummaryRowProps) => (
    <>
        <Flex
            justify="space-between"
            align="center"
            gap={12}
            className="min-h-[60px] w-full flex-wrap sm:flex-nowrap px-3 py-[14px] sm:px-[18px]"
        >
            <Typography.Text className="font-normal text-sm sm:text-base text-[#1e293b]">
                {label}
            </Typography.Text>
            {amount && (
                <Typography.Text className="font-normal text-sm sm:text-base text-[#1e293b] text-right">
                    {formatAmount(Number(amount))}
                </Typography.Text>
            )}
            {children}
        </Flex>
        <Divider className="m-0" />
    </>
);

export default SummaryRow;
