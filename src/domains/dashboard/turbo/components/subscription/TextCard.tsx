import React from 'react';

import { Col, Flex, Typography } from 'antd';

type Props = {
    label?: string;
    value?: string;
    valueColor?: string;
    classNames?: string;
};

const TextCard = ({ label, value, valueColor, classNames }: Props) => (
    <Col span={12} sm={8} md={6} lg={4} className={classNames}>
        <Flex vertical className='justify-between h-full gap-1'>
            {label && <Typography.Text className="text-gray-400">{label}</Typography.Text>}
            <Typography.Text className={valueColor && `text-[${valueColor}]`}>
                {value}
            </Typography.Text>
        </Flex>
    </Col>
);

export default TextCard;
