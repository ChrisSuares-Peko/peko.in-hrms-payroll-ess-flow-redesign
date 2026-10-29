import React from 'react';

import { Flex, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

type ChargeRowProps = {
    label: string;
    amount?: number;
    valueText?: string;
    testId?: string;
};

const ChargeRow: React.FC<ChargeRowProps> = ({ label, amount = 0, valueText, testId }) => (
    <Flex justify="space-between" className="mt-2 sm:mt-4 sm:px-3">
        <Typography.Text className="text-[.85rem] xs:text-[0.69rem] sm:text-base xs:w-44 md:w-80">
            {label}
        </Typography.Text>
        <Typography.Text
            className="text-[.85rem] xs:text-[0.69rem] sm:text-base"
            data-testid={testId}
        >
            {valueText ?? `₹ ${formatNumberWithLocalString(amount)}`}
        </Typography.Text>
    </Flex>
);

export default ChargeRow;
