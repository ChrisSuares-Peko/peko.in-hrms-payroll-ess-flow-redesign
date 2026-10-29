import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';

import { OrderDatatype } from '../types/systemUserTypes';

export const data: OrderDatatype[] = [
    {
        id: '1',
        date: <span>2014-12-24 </span>,
        productName: 'CASIO CALCULATOR MJ-120D PLUS',
        customer: 'Savoll FZ LLC',
        amount: '₹ 160.00',
        status: <Typography.Text className="text-brandColor">PENDING</Typography.Text>,
        action: <EditOutlined />,
        view: <EyeOutlined />,
    },
    {
        id: '2',
        date: <span>2014-12-24 </span>,
        productName: 'Logitech MK 120 Keyboard & Mouse',
        customer: 'Savoll FZ LLC',
        amount: '₹ 160.00',
        status: <Typography.Text className="text-textGreenLight">Success</Typography.Text>,
        action: <EditOutlined />,
        view: <EyeOutlined />,
    },
    {
        id: '3',
        date: <span>2014-12-24 </span>,
        productName: 'Neo OV944',
        customer: 'Savoll FZ LLC',
        amount: '₹ 160.00',
        status: <Typography.Text disabled>Cancelled</Typography.Text>,
        action: <EditOutlined />,
        view: <EyeOutlined />,
    },
];

export const columns: ColumnsType<OrderDatatype> = [
    {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
    },
    {
        title: 'Product Name',
        dataIndex: 'productName',
        key: 'productName',
    },
    {
        title: 'Customer',
        dataIndex: 'customer',
        key: 'customer',
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
    },
    {
        title: 'Order Status',
        dataIndex: 'status',
        key: 'status',
    },
    {
        title: 'Actions',
        dataIndex: 'action',
        key: 'action',
    },
    {
        title: 'View',
        dataIndex: 'view',
        key: 'view',
    },
];
