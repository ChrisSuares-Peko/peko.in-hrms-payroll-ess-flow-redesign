import { DeleteOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Flex, Space, Spin, TableProps, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import fleetDoc from '@domains/dashboard/PekoCloud/assets/icons/fleetDoc.svg';

import { formatDate } from '../helperFunctions';

const formatText = (text: string | number) => {
    if (!text) return '';
    const stringText = String(text); // Convert any input to a string
    return stringText.charAt(0).toUpperCase() + stringText.slice(1).toLowerCase();
};

export const fleetDocColumn = (
    handleDelete: (record: any) => void,
    handleEdit: (record: any) => void,
    handleDocDownload: (record: any) => void,
    loadingRows: any
): TableProps<any>['columns'] => [
    {
        title: 'Document Name',
        dataIndex: 'documentName',
        key: 'documentName',
        render: (text: string, record: any) => (
            <Flex gap={10}>
                <Flex align="center">
                    <ReactSVG src={fleetDoc} />
                </Flex>
                <Flex vertical justify="center">
                    <Typography.Text className="text-base text-gray-900   whitespace-nowrap">
                        {text}
                    </Typography.Text>
                </Flex>
            </Flex>
        ),
    },
    {
        title: 'Document Number',
        dataIndex: 'documentNumber',
        key: 'documentNumber',
    },
    {
        title: 'Document Type',
        dataIndex: 'documentType',
        key: 'documentType',
        render: documentType => documentType || 'N/A',
    },
    {
        title: 'Issued Date',
        dataIndex: 'issueDate',
        key: 'issueDate',
        render: issueDate => (
            <Typography.Text className="whitespace-nowrap">
                {issueDate ? formatDate(issueDate) : 'N/A'}
            </Typography.Text>
        ),
    },
    {
        title: 'Expiry Date',
        dataIndex: 'expireDate',
        key: 'expireDate',
        render: expireDate => (
            <Typography.Text className="whitespace-nowrap">
                {expireDate ? formatDate(expireDate) : 'N/A'}
            </Typography.Text>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status, record) => {
            let colorClass = '';
            if (status === 'Active') {
                colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
            } else if (status === 'Expired') {
                colorClass = 'text-[#FDA700] bg-[#FFFBE4]';
            } else if (status === 'Upcoming') {
                colorClass = 'text-[#007BFF] bg-[#E0F3FF]';
            }
            const formattedStatus = formatText(status);
            return record.expireDate ? (
                <Typography.Text
                    className={`${colorClass} font-normal px-3 py-1 rounded-2xl  whitespace-nowrap`}
                >
                    {formattedStatus}
                </Typography.Text>
            ) : (
                <Typography.Text className="text-[#05BE63] bg-[#DDFFE2] font-normal px-3 py-1 rounded-2xl  whitespace-nowrap">
                    Active
                </Typography.Text>
            );
        },
    },
    {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        width: '10%',
        render: (text, record) => (
            <Space size="middle">
                {/* <a href={record.document} target="_blank" rel="noopener noreferrer" download> */}
                <Button
                    onClick={() => handleDocDownload(record)}
                    className="border-0"
                    disabled={record.documentAvailability === 'NA' || loadingRows[record.id]}
                >
                    {loadingRows[record.id] ? (
                        <Spin size="small" className="text-xs" />
                    ) : (
                        <DownloadOutlined
                            className={`text-green-400 ${record.documentAvailability === 'NA' ? 'opacity-50' : ''}`}
                        />
                    )}
                </Button>

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
