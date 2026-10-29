import { Table, Tag, Button, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { IOrderDetailsFilter } from '../../hooks/order/useOrderHistory';
import { IPurchaseItem } from '../../types/product';

const columns: ColumnsType<IPurchaseItem> = [
    {
        title: 'Purchased On',
        dataIndex: 'purchasedOn',
        key: 'purchasedOn',
    },
    {
        title: 'Product Name',
        dataIndex: 'productName',
        key: 'productName',
    },
    {
        title: 'Plan Name',
        dataIndex: 'planName',
        key: 'planName',
    },
    {
        title: 'Order ID',
        dataIndex: 'orderId',
        key: 'orderId',
    },
    {
        title: 'Payment Mode',
        dataIndex: 'paymentMode',
        key: 'paymentMode',
        render: (mode: string) => (mode ? mode[0].toUpperCase() + mode.slice(1).toLowerCase() : ''),
    },
    {
        title: 'Total Amount',
        dataIndex: 'totalAmount',
        key: 'totalAmount',
        render: (amount: number) => `₹ ${Number(amount).toFixed(2)}`,
    },
    {
        title: 'Payment Status',
        key: 'status',
        dataIndex: 'status',
        render: (status: string) => (
            <Tag color="green" style={{ borderRadius: 20, padding: '4px 12px' }}>
                {status[0].toUpperCase() + status.slice(1).toLowerCase()}
            </Tag>
        ),
    },
    {
        title: 'Action',
        key: 'action',
        render: (_, record: IPurchaseItem) => (
            <Link to={`${paths.softwares.managePlan}/${record.orderId}`}>
                <Button disabled={record.status === 'FAILURE'} danger type="default">
                    View
                </Button>
            </Link>
        ),
    },
];

type Props = {
    isLoading: boolean;
    orderDetails: IPurchaseItem[];
    handlePagination: (page: number, pageSize: number) => void;
    filter: IOrderDetailsFilter;
    total: number;
};

const OrderTable = ({ isLoading, orderDetails, handlePagination, filter, total }: Props) => (
    <Table
        className="order-history-table"
        columns={columns}
        dataSource={orderDetails}
        loading={isLoading}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" /> }}
        pagination={
            orderDetails.length > 0
                ? {
                      current: filter.page,
                      pageSize: filter.limit,
                      total,
                      showSizeChanger: true,
                      position: ["bottomRight"],
                      onChange: handlePagination,
                  }
                : false
        }
    />
);

export default OrderTable;
