import { DownloadOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { TableProps, Space, Button, Typography } from 'antd';

import { incrementTable } from '../../types/salaryProfileTypes/incrementTypes';

export const incrementColumn = (
    handleDelete: (id: incrementTable) => void,
    handleEdit: (id: incrementTable) => void
): TableProps<incrementTable>['columns'] => [
    {
        title: <Typography.Text>Date Added</Typography.Text>,
        dataIndex: 'dateAdded',
        key: 'dateAdded',
    },
    {
        title: <Typography.Text>Previous Basic Salary</Typography.Text>,
        dataIndex: 'previousBasicSalary',
        key: 'previousBasicSalary',
        render: text =>
            `AED ${parseFloat(text)
                .toFixed(2)
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
    },
    {
        title: <Typography.Text>Increment Percentage/Amount</Typography.Text>,
        dataIndex: 'incrementAmount',
        key: 'incrementAmount',
        render: (_: any, record: any) => {
            const value = parseFloat(record.incrementAmount || '0');
            if (record.incrementType === 'flat') {
                return `₹  ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
            }
            if (record.incrementType === 'percentage') {
                return `${value.toFixed(2)} % of Basic Pay`;
            }
            return '-';
        },
    },
    {
        title: <Typography.Text>New Basic Salary</Typography.Text>,
        dataIndex: 'newBasicSalary',
        key: 'newBasicSalary',
        render: text =>
            `AED ${parseFloat(text)
                .toFixed(2)
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
    },
    {
        title: <Typography.Text>Effective From</Typography.Text>,
        dataIndex: 'effectiveDate',
        key: 'effectiveDate',
    },

    {
        title: <Typography.Text>Status</Typography.Text>,
        dataIndex: 'status',
        key: 'status',
        render: status =>
            // Capitalize the first letter and make the rest lowercase
            status ? `${status.charAt(0).toUpperCase()}${status.slice(1).toLowerCase()}` : '',
    },
    {
        title: <Typography.Text>Action</Typography.Text>,
        dataIndex: 'action',
        key: 'action',
        width: '10%',
        render: (text, record) => (
            <Space size="middle">
                <a href={record.url} target="_blank" rel="noopener noreferrer" download>
                    <Button className="border-0" disabled={record.document === 'NA'}>
                        <DownloadOutlined
                            className={`text-green-400 ${record.document === 'NA' ? 'opacity-50' : ''}`}
                        />
                    </Button>
                </a>

                <Button className="border-0">
                    <DeleteOutlined
                        className="text-[#E30000]"
                        onClick={() => handleDelete(record)}
                    />
                </Button>
                <Button className="border-0">
                    <EditOutlined className="text-[#E30000]" onClick={() => handleEdit(record)} />
                </Button>
            </Space>
        ),
    },
];
