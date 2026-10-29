import { EyeOutlined } from '@ant-design/icons';
import { Tag, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';

import { formattedDateOnly } from '@utils/dateFormat';

import { AdminComplianceRecord, AdminComplianceStatus } from '../../types/compliance';

const STATUS_COLOR: Record<AdminComplianceStatus, string> = {
    pending: 'orange',
    in_review: 'blue',
    approved: 'green',
    rejected: 'red',
    reopened: 'purple',
};

const STATUS_LABEL: Record<AdminComplianceStatus, string> = {
    pending: 'Pending',
    in_review: 'In Review',
    approved: 'Approved',
    rejected: 'Rejected',
    reopened: 'Reopened',
};

interface ColumnsProps {
    onViewDetails: (record: AdminComplianceRecord) => void;
}

const getComplianceColumns = ({
    onViewDetails,
}: ColumnsProps): ColumnsType<AdminComplianceRecord> => [
    {
        title: 'User Name',
        key: 'userName',
        sorter: true,
        render: (_: any, record: AdminComplianceRecord) => (
            <Typography.Text>{record.corporateUser?.name || 'N/A'}</Typography.Text>
        ),
    },
    {
        title: 'Email',
        key: 'email',
        render: (_: any, record: AdminComplianceRecord) => (
            <Typography.Text>{record.corporateUser?.email || 'N/A'}</Typography.Text>
        ),
    },
    {
        title: 'Compliance Type',
        dataIndex: 'complianceType',
        key: 'complianceType',
        render: (type: string) => <Typography.Text>{type || 'N/A'}</Typography.Text>,
    },
    {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        render: (title: string) => <Typography.Text>{title || 'N/A'}</Typography.Text>,
    },
    {
        title: 'Due Date',
        dataIndex: 'dueDate',
        key: 'dueDate',
        sorter: true,
        render: (date: string) => (
            <Typography.Text className="text-nowrap">
                {date ? formattedDateOnly(new Date(date)) : 'N/A'}
            </Typography.Text>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: AdminComplianceStatus) => (
            <Tag color={STATUS_COLOR[status] ?? 'default'}>{STATUS_LABEL[status] ?? status}</Tag>
        ),
    },
    {
        title: 'Documents',
        key: 'documents',
        render: (_: any, record: AdminComplianceRecord) => (
            <Typography.Text>{record.documents?.length ?? 0} file(s)</Typography.Text>
        ),
    },
    {
        title: 'Action',
        key: 'action',
        render: (_: any, record: AdminComplianceRecord) => (
            <Tooltip title="View Details">
                <EyeOutlined
                    className="cursor-pointer text-lg text-blue-500 hover:text-blue-700"
                    onClick={() => onViewDetails(record)}
                />
            </Tooltip>
        ),
    },
];

export default getComplianceColumns;
