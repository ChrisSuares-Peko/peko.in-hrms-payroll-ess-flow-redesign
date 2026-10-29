import { DownloadOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { TableProps, Typography, Space, Button, Flex } from 'antd';

import { assetTable, documentTable } from '../../types/docAndAssetsTypes';

const formatText = (text: string | number) => {
    if (!text) return '';
    const stringText = String(text); // Convert any input to a string
    return stringText.charAt(0).toUpperCase() + stringText.slice(1).toLowerCase();
};
export const Documentcolumns = (
    handleDelete: (id: documentTable) => void,
    handleEdit: (id: documentTable) => void,
    showEmployeeNameColumn: boolean
): TableProps<documentTable>['columns'] => [
    {
        title: <Typography.Text>Date Added</Typography.Text>,
        dataIndex: 'dateAdded',
        key: 'date',
    },

    ...(showEmployeeNameColumn
        ? [
              {
                  title: <Typography.Text>Employee Name</Typography.Text>,
                  dataIndex: 'employeeName',
                  key: 'employeeName',
              },
          ]
        : []),

    {
        title: <Typography.Text>Document Name</Typography.Text>,
        dataIndex: 'documentName',
        key: 'documentName',
    },

    {
        title: <Typography.Text>Expiry Date</Typography.Text>,
        dataIndex: 'expiryDate',
        key: 'expiryDate',
    },
    {
        title: <Typography.Text>Action</Typography.Text>,
        dataIndex: 'action',
        key: 'action',
        render: (text, record) => (
            <Space size="middle">
                <a href={record.url} target="_blank" rel="noopener noreferrer" download>
                    <Button className="border-0" disabled={record.url === 'NA'}>
                        <DownloadOutlined
                            className={`text-green-400 ${record.url === 'NA' ? 'opacity-50' : ''}`}
                        />
                    </Button>
                </a>
                <Button className="border-0" onClick={() => handleDelete(record)}>
                    <DeleteOutlined className="text-[#E30000]" />
                </Button>
                <Button className="border-0" onClick={() => handleEdit(record)}>
                    <EditOutlined className="text-[#E30000]" />
                </Button>
            </Space>
        ),
    },
];

export const Assetcolumns = (
    handleDelete: (id: assetTable) => void,
    handleEdit: (id: assetTable) => void
): TableProps<assetTable>['columns'] => [
    {
        title: <Typography.Text>Date Added</Typography.Text>,
        dataIndex: 'dateAdded',
        key: 'date',
    },
    {
        title: <Typography.Text>Asset Type</Typography.Text>,
        dataIndex: 'assetType',
        key: 'assetType',
    },

    {
        title: <Typography.Text>Asset Name</Typography.Text>,
        dataIndex: 'assetName',
        key: 'assetName',
    },
    {
        title: <Typography.Text>Asset ID</Typography.Text>,
        dataIndex: 'assetId',
        key: 'assetId',
    },
    {
        title: <Typography.Text>Batch No</Typography.Text>,
        dataIndex: 'batchNo',
        key: 'batchNo',
    },
    {
        title: <Typography.Text>Purchased Date</Typography.Text>,
        dataIndex: 'purchasedDate',
        key: 'purchasedDate',
    },
    {
        title: <Typography.Text>User</Typography.Text>,
        dataIndex: 'user',
        key: 'user',
    },

    {
        title: <Typography.Text>Status</Typography.Text>,
        dataIndex: 'status',
        key: 'status',
        render: status => {
            let colorClass = '';
            if (status === 'ACTIVE' || status === 'AVAILABLE') {
                colorClass = 'text-[#05BE63]';
            } else if (status === 'IN USE') {
                colorClass = 'text-[#FDA700]';
            }
            const formattedStatus = formatText(status);
            return (
                <Typography.Text className={`${colorClass} font-normal`}>
                    {formattedStatus}
                </Typography.Text>
            );
        },
    },
    {
        title: <Typography.Text>Action</Typography.Text>,
        dataIndex: 'action',
        key: 'action',

        render: (text, record) => (
            <Flex align="center">
                <Button className="border-0" onClick={() => handleDelete(record)}>
                    <DeleteOutlined className="text-[#E30000]" />
                </Button>

                <Button className="border-0" onClick={() => handleEdit(record)}>
                    <EditOutlined className="text-[#E30000]" />
                </Button>
            </Flex>
        ),
    },
];


 export const statusType = [
        { label: 'Active', value: 'Active' },
        { label: 'Available', value: 'Available' },
        { label: 'In Use', value: 'In use' },
    ];
