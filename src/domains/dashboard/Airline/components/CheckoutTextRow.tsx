import React, { ReactNode } from 'react';

import { Flex, Typography } from 'antd';

type Props = {
    text: string;
    value: string | number;
    bold?: boolean;
    info?: ReactNode;
};

function CheckoutTextRow({ text, value, bold, info }: Props) {
    return (
        <Flex className=" w-full" justify="space-between" align="center">
            <Flex gap={4}>
                <Typography.Text
                    className={`${
                        bold ? 'text-zinc-900 text-base' : 'text-gray-500 text-sm'
                    } font-normal`}
                >
                    {text}
                </Typography.Text>
                {info}
            </Flex>
            <Typography.Text
                className={`${
                    bold ? 'text-base font-semibold' : 'text-sm font-medium'
                } text-zinc-900 `}
            >
                ₹ {value}
            </Typography.Text>
        </Flex>
    );
}

export default CheckoutTextRow;
