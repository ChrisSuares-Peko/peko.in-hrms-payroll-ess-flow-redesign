import React from 'react';

import { Flex, Table, Typography } from 'antd';

const ConversationCharges = () => {
    const columns = [
        {
            title: 'Type of messages',
            dataIndex: 'type',
            key: 'type',
        },
        {
            title: 'Charges per message',
            dataIndex: 'charges',
            key: 'charges',
        },
    ];

    const data = [
        {
            key: '1',
            type: 'Marketing messages',
            charges: '₹ 1.1262',
        },
        {
            key: '2',
            type: 'Utility messages',
            charges: '₹ 0.268',
        },
        {
            key: '3',
            type: 'Authentication',
            charges: '₹ 0.268',
        },
        {
            key: '4',
            type: 'Service',
            charges: 'Unlimited Free Service Conversations',
        },
    ];

    return (
        <Flex vertical justify="center" gap={20} align="center" className="w-full">
            <Typography.Text className="text-xl font-medium text-center">
                Conversation Charges
            </Typography.Text>
            <Table
                columns={columns}
                dataSource={data}
                pagination={false}
                rowClassName={() => 'custom-row-height'}
                className="w-full lg:w-1/2 bg-white"
                bordered
            />
        </Flex>
    );
};

export default ConversationCharges;
