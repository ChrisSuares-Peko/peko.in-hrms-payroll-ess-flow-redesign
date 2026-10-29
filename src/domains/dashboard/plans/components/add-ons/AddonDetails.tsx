import React from 'react';

import { Card, Divider, Flex, Typography } from 'antd';

import PaymentDetails from './PaymentDetails';

interface AddonDetailsProps {
    title: string;
    description: string;
    rows: {
        column1: string;
        column2: string;
        column3: string;
    }[];
}
const AddonDetails = ({ title, description, rows }: AddonDetailsProps) => (
    <Flex vertical className="w-full lg:w-4/6">
        <Card
            className="p-3 border-0 sm:rounded-2xl sm:border border-borderGray md:p-7"
            styles={{ body: { padding: 0 } }}
        >
            <Flex gap={10}>
                <Typography.Title level={5}>{title}</Typography.Title>
                <Typography.Text className="mt-1 text-xs">{description}</Typography.Text>
            </Flex>
            <Divider />
            <Flex vertical className="w-full mt-5" gap={15}>
                {rows.map((item, index) => (
                    <PaymentDetails
                        key={index}
                        column1={item.column1}
                        column2={item.column2}
                        column3={item.column3}
                    />
                ))}
            </Flex>
        </Card>
    </Flex>
);

export default AddonDetails;
