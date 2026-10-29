import React from 'react';

import { Flex, Typography, Divider } from 'antd';
import { ReactSVG } from 'react-svg';

import Tick from '@src/assets/svg/tick.svg';

type Props = {
    itemsWithTicks: string[];
    itemsWithoutTicks?: string[];
};

const ListPoints = ({ itemsWithTicks, itemsWithoutTicks }: Props) => {
    const renderItems = (items: string[], showTicks: boolean) => {
        if (!Array.isArray(items) || items.length === 0) {
            return null;
        }
        return items.map((item, index) => (
            <Flex align="center" key={index}>
                {showTicks && <ReactSVG className="mr-2" src={Tick} />}
                <Typography.Text className="text-xs font-normal">{item}</Typography.Text>
            </Flex>
        ));
    };

    return (
        <Flex vertical gap={16}>
            <Flex vertical className="gap-5">
                {renderItems(itemsWithTicks, true)}
            </Flex>
            {itemsWithoutTicks && itemsWithoutTicks?.length! > 0 && (
                <>
                    {' '}
                    <Divider />{' '}
                    <Flex vertical className="gap-5">
                        {renderItems(itemsWithoutTicks, false)}
                    </Flex>{' '}
                </>
            )}
        </Flex>
    );
};

export default ListPoints;
