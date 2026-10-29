import React from 'react';

import { CheckOutlined } from '@ant-design/icons';
import { Flex, Typography, Divider } from 'antd';

type Props = {
    itemsWithTicks: string[];
    itemsWithoutTicks?: string[];
    shouldSkip?: boolean;
};

const ListPoints = ({ itemsWithTicks, itemsWithoutTicks, shouldSkip }: Props) => {
    const renderItems = (items: string[], showTicks: boolean) => {
        if (!Array.isArray(items) || items.length === 0) {
            return null;
        }
        return items.map((item, index) => (
            <Flex align="center" gap={5} key={index}>
                {showTicks && (
                    <CheckOutlined className={shouldSkip ? 'text-gray-500' : 'text-green-500 '} />
                )}
                <Typography.Text className="text-xs font-normal">{item}</Typography.Text>
            </Flex>
        ));
    };

    return (
        <Flex vertical gap={16}>
            <Flex vertical className="gap-3">
                {renderItems(itemsWithTicks, true)}
            </Flex>
            {itemsWithoutTicks && itemsWithoutTicks?.length! > 0 && (
                <>
                    {' '}
                    <Divider />{' '}
                    <Flex vertical className="gap-3">
                        {renderItems(itemsWithoutTicks, false)}
                    </Flex>{' '}
                </>
            )}
        </Flex>
    );
};

export default ListPoints;
