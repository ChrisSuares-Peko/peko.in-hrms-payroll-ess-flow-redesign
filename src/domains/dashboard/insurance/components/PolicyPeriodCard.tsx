import React from 'react';

import { Flex, Radio, Tag } from 'antd';

import { policyPeriodType } from '../types/type';

const PolicyPeriodCard = ({ id, discount, duration, price }: policyPeriodType) => (
    <Flex
        wrap="wrap"
        align="center"
        justify="center"
        className="py-3  min-w-56 flex flex-col rounded-md border border-neutral-5"
    >
        <Radio value={price} className="text-gray-400 text-base ">
            {duration} @<span className="font-medium text-black "> ₹ {price}</span>{' '}
        </Radio>
        {discount && (
            <Tag color="green" className="mx-2 mt-1 w-fit text-center font-medium">
                Save ₹ {discount}
            </Tag>
        )}
    </Flex>
);

export default PolicyPeriodCard;
