import React from 'react';

import { Checkbox, Col, Flex, InputNumber } from 'antd';

import { personList } from '../types/type';

const PersonNameCard = ({ personName, isIncrease }: personList) => (
    <Col xs={11} sm={7} xl={5} className="pl-5 sm:pr-5 py-3 rounded-md border border-neutral-5">
        <Flex justify="space-between" className="gap-5 flex md:flex-row flex-col md:items-center">
            <Checkbox value={personName}>{personName}</Checkbox>
            {isIncrease && (
                <InputNumber size="small" className="md:w-2/5" min={1} max={10} defaultValue={1} />
            )}
        </Flex>
    </Col>
);

export default PersonNameCard;
