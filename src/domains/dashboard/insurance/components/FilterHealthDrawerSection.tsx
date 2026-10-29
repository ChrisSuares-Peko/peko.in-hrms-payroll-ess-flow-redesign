import React, { useState } from 'react';

import { Flex, Radio, Space, Typography } from 'antd';
import CheckableTag from 'antd/es/tag/CheckableTag';

import { amountsForFiltering } from '../utils/data';

const FilterHealthDrawerSection = () => {
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const handleChange = (tag: string, checked: boolean) => {
        const nextSelectedTags = checked
            ? [...selectedTags, tag]
            : selectedTags.filter(t => t !== tag);
        setSelectedTags(nextSelectedTags);
    };
    return (
        <Flex vertical gap={20} className="my-5">
            <Typography.Text className="text-lg font-medium capitalize">
                Select Plan Type
            </Typography.Text>
            <Radio.Group buttonStyle="outline" size="large" defaultValue="individual">
                <Radio value="shared">Shared (Family Plan)</Radio>
                <Radio value="individual">Individual</Radio>
            </Radio.Group>
            <Typography.Text className="text-lg font-medium capitalize">
                Select Cover Amount
            </Typography.Text>
            <Space size={[0, 8]} wrap>
                {amountsForFiltering.map(amount => (
                    <CheckableTag
                        key={amount}
                        checked={selectedTags.includes(amount)}
                        onChange={checked => handleChange(amount, checked)}
                        className="border-2  border-neutral-200 shadow- px-5 py-2"
                    >
                        {amount} Lakhs
                    </CheckableTag>
                ))}
            </Space>
        </Flex>
    );
};

export default FilterHealthDrawerSection;
