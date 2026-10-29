import React from 'react';

import { Checkbox, Flex, Typography } from 'antd';

import { AddonsDataType } from '../types/type';

interface AddOnsSectionProps {
    sectionTitle?: string;
    data?: AddonsDataType[];
}

const FilterVehicleDrawerSection = ({ sectionTitle, data }: AddOnsSectionProps) => (
    <Flex vertical gap={20} className="my-5">
        <Typography.Text className="text-lg font-medium capitalize">{sectionTitle}</Typography.Text>
        {data &&
            data.map((item, i) => (
                <Flex gap={10} key={i} vertical>
                    <Checkbox style={{ fontSize: '16px', fontWeight: 500 }}>{item.title} </Checkbox>
                    <Typography.Text className="capitalize ml-7 text-gray-600 text-sm">
                        {item.description}
                    </Typography.Text>
                </Flex>
            ))}
    </Flex>
);

export default FilterVehicleDrawerSection;
