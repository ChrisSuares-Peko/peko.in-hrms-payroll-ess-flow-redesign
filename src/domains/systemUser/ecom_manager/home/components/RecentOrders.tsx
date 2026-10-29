import React from 'react';

import { Table, Typography, Flex, theme } from 'antd';

import { OrderHistoryColumns } from '@domains/systemUser/ecom_manager/home/utils/dashData';
import { paths } from '@src/routes/paths';

import useOrdersDashboard from '../hooks/useOrdersDashboard';

type OrderHistoryPageProps = {};

const RecentOrders: React.FC<OrderHistoryPageProps> = () => {
    const { tableData } = useOrdersDashboard();

    const {
        token: { colorPrimary },
    } = theme.useToken();

    return (
        <Flex vertical gap={20} className="pt-10">
            <Flex justify="space-between">
                <Typography.Text className="text-lg font-medium xl:text-xl lg:text-lg sm:text-lg ">
                    Recent Orders
                </Typography.Text>
                <Typography.Link
                    style={{ color: colorPrimary }}
                    href={paths.systemUser.officeSupplies}
                    className="text-xs md:text-base"
                >
                    View all
                </Typography.Link>
            </Flex>
            <Table columns={OrderHistoryColumns} dataSource={tableData} pagination={false} />
        </Flex>
    );
};

export default RecentOrders;
