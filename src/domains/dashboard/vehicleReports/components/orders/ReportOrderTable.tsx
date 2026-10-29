import { Flex, Table, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import OrderActionButtons from './OrderActionButtons';
import { ReportOrderDetail } from '../../types/index';
import ReportOrderStatusBadge from '../shared/ReportOrderStatusBadge';

const { Text } = Typography;

interface Props {
    rows: ReportOrderDetail[];
    isLoading: boolean;
    onView: (order: ReportOrderDetail) => void;
    onDownload: (order: ReportOrderDetail) => void;
}

const ReportOrderTable = ({ rows, isLoading, onView, onDownload }: Props) => {
    const columns: ColumnsType<ReportOrderDetail> = [
        {
            title: 'Report',
            dataIndex: 'reportName',
            render: (value: string) => <Text className="text-sm text-[#42526D]">{value}</Text>,
        },
        {
            title: 'Vehicle',
            dataIndex: 'vehicleNumber',
            render: (value: string, record) => (
                <Flex vertical>
                    <Text className="text-sm text-[#42526D]">{value}</Text>
                    <Text className="text-xs text-[#98A2B3]">{record.vehicleModel}</Text>
                </Flex>
            ),
        },
        {
            title: 'Order ID',
            dataIndex: 'orderId',
            render: (value: string) => <Text className="text-sm text-[#42526D]">{value}</Text>,
        },
        {
            title: 'Date',
            dataIndex: 'orderDate',
            render: (value: string) => (
                <Text className="text-sm text-[#42526D]">
                    {dayjs(value).format('DD MMM YYYY')}
                </Text>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            render: (value: number) => (
                <Text className="text-sm text-[#42526D]">
                    {`₹ ${formatNumberWithLocalString(value)}`}
                </Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            render: (_, record) => <ReportOrderStatusBadge status={record.status} />,
        },
        {
            title: 'ACTION',
            key: 'action',
            align: 'right',
            render: (_, record) => (
                <OrderActionButtons
                    canDownload={record.status === 'Ready'}
                    onView={() => onView(record)}
                    onDownload={() => onDownload(record)}
                />
            ),
        },
    ];

    return (
        <Table
            rowKey="orderId"
            loading={isLoading}
            dataSource={rows}
            columns={columns}
            pagination={false}
            scroll={{ x: 900 }}
        />
    );
};

export default ReportOrderTable;
