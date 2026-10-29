import React from 'react';

import { BankOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

const EmptyAccounts: React.FC = () => (
    <Flex vertical align="center" justify="center" gap={8} className="py-10">
        <BankOutlined className="text-3xl text-[#D0D5DD]" />
        <Typography.Text className="text-sm text-[#6A7282]">No accounts found</Typography.Text>
    </Flex>
);

export default React.memo(EmptyAccounts);
