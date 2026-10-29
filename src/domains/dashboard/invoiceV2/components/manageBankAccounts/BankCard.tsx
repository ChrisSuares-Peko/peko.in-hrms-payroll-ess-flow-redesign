import React from 'react';

import { Flex, Typography } from 'antd';

interface BankCardField {
    label: string;
    value: string;
}

interface BankCardProps {
    name: string;
    fields: BankCardField[];
    badge?: React.ReactNode;
    actions?: React.ReactNode;
}

const BankCard: React.FC<BankCardProps> = ({ name, fields, badge, actions }) => (
    <Flex
        vertical
        gap={12}
        className="bg-[#F9FAFB] border border-[#E4E4E7] rounded-2xl px-4 py-4 md:px-5"
    >
        <Flex vertical gap={12} className="md:flex-row md:items-center md:justify-between">
            <Flex align="center" gap={10} wrap="wrap">
                <Typography.Text className="text-sm md:text-base font-semibold text-[#101828] break-words">
                    {name}
                </Typography.Text>
                {badge}
            </Flex>
            <div className="w-full md:w-auto">{actions}</div>
        </Flex>

        <Flex vertical gap={8}>
            {Array.from({ length: Math.ceil(fields.length / 2) }, (_, i) => (
                <Flex key={i} vertical gap={8} className="sm:flex-row sm:justify-between">
                    {fields.slice(i * 2, i * 2 + 2).map(({ label, value }) => (
                        <Typography.Text
                            key={label}
                            className="text-sm text-[#344054] w-full sm:w-[48%] break-words"
                        >
                            {label}:{' '}
                            <Typography.Text className="text-sm font-normal text-[#101828] break-all">
                                {value}
                            </Typography.Text>
                        </Typography.Text>
                    ))}
                </Flex>
            ))}
        </Flex>
    </Flex>
);

export default React.memo(BankCard);
