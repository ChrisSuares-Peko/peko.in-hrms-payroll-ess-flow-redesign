import { useState } from 'react';

import { Flex, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { useAppSelector } from '@src/hooks/store';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { getChallanOrderDetail } from '../api/index';
import ChallanOrderDetailsDrawer from '../components/ChallanOrderDetailsDrawer';
import ChallanOrderStatusBadge from '../components/ChallanOrderStatusBadge';
import useChallanOrders from '../hooks/useChallanOrders';
import { ChallanOrder } from '../types/index';

const { Text } = Typography;

// Shared Order History screen for both Bill Payments and Turbo challan flows.
const ChallanOrderHistoryPage = () => {
    const { orders, isLoading } = useChallanOrders();
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [selectedOrder, setSelectedOrder] = useState<ChallanOrder | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    // Open with the row's fields, then enrich with live Droom order-detail.
    const handleView = async (record: ChallanOrder) => {
        setSelectedOrder(record);
        setIsDetailLoading(true);
        const detail = await getChallanOrderDetail({ userId: id, userType: role, orderId: record.orderId });
        if (detail) {
            setSelectedOrder(prev => (prev && prev.orderId === record.orderId ? { ...prev, ...detail } : prev));
        }
        setIsDetailLoading(false);
    };

    const columns: ColumnsType<ChallanOrder> = [
        {
            title: 'Order ID',
            dataIndex: 'orderId',
            key: 'orderId',
            render: (value: string) => <Text className="text-[#42526D]">{value}</Text>,
        },
        {
            title: 'Order Date',
            dataIndex: 'orderDate',
            key: 'orderDate',
            render: (value: string) => (
                <Text className="whitespace-nowrap text-[#42526D]">
                    {(value || '').split(' ')[0]}
                </Text>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (value: number) => (
                <Text className="whitespace-nowrap text-[#42526D]">
                    ₹ {formatNumberWithLocalString(value)}
                </Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (_, record) => <ChallanOrderStatusBadge status={record.status} />,
        },
        {
            title: 'Action',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Text
                    className="cursor-pointer text-sm font-medium text-[#FF4F4F]"
                    onClick={() => handleView(record)}
                >
                    View
                </Text>
            ),
        },
    ];

    return (
        <Flex vertical gap={4}>
            <Text className="text-xl font-semibold text-[#101828]">Order History</Text>
            <Text className="text-sm text-[#667085]">Track your challan payment orders</Text>

            <Table
                rowKey="orderId"
                columns={columns}
                dataSource={orders}
                loading={isLoading}
                pagination={false}
                scroll={{ x: 800 }}
                className="mt-6 w-full"
            />

            <ChallanOrderDetailsDrawer
                open={!!selectedOrder}
                order={selectedOrder}
                loading={isDetailLoading}
                onClose={() => setSelectedOrder(null)}
            />
        </Flex>
    );
};

export default ChallanOrderHistoryPage;
