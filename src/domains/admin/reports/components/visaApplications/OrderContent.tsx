import React from 'react';

import { Flex } from 'antd';

// import { columns, data } from '@src/domains/admin/officeSupplies/utils/data';

type OrderHistoryPageProps = {};

const OrderContent: React.FC<OrderHistoryPageProps> = () => (
    <Flex vertical gap={20} className="pt-10">
        {/* <Table columns={columns} dataSource={tableData} /> */}
        <p>table here</p>
    </Flex>
);

export default OrderContent;
