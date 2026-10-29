import React from 'react';

import { Flex, Typography } from 'antd';

const Facilities = ({ facilities, setView, view }: any) => (
    <Flex vertical gap={15}>
        <Typography.Text className="font-medium mt-3 text-lg ">Facilities</Typography.Text>
        <ol style={{ lineHeight: '1.5' }}>
            {facilities?.map((item: any, index: any) => (
                <li key={index} style={{ marginBottom: '10px' }}>
                    <Typography.Text>{item}</Typography.Text>
                </li>
            ))}
        </ol>
    </Flex>
);

export default Facilities;
