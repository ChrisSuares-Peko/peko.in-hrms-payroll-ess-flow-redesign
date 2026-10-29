import { DeleteOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Flex, Space, Spin, TableProps, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import defaultCompanyDoc from '@domains/dashboard/PekoCloud/assets/icons/defaultCompanyDoc.svg';

import { formatDate } from './helperFunctions';

const formatText = (text: string | number) => {
    if (!text) return '';
    const stringText = String(text); // Convert any input to a string
    return stringText.charAt(0).toUpperCase() + stringText.slice(1).toLowerCase();
};

export const companyDocColumn = (
    handleDelete: (record: any) => void,
    handleEdit: (record: any) => void,
    handleDocDownload: (record: any) => void,
    loadingRows: any
): TableProps<any>['columns'] => [
    {
        title: ' Document Name',

        dataIndex: 'documentName',
        key: 'documentName',
        className: 'ant-table-tbody-ant-table-cell',
        render: (text: string, record: any) => (
            <Flex gap={10} className="-ml-[.125rem]">
                <Flex align="center" justify="start">
                    <ReactSVG src={defaultCompanyDoc || record?.document} />
                </Flex>
                <Flex vertical justify="center">
                    <Typography.Text className="font-medium text-gray-900 whitespace-nowrap">
                        {text}
                    </Typography.Text>
                </Flex>
            </Flex>
        ),
    },
    {
        title: ' Document Number',
        dataIndex: 'documentNumber',
        key: 'documentNumber',
        className: 'ant-table-tbody-ant-table-cell',
        render: (text: string) => (
            <Flex className="ml-[.125rem] whitespace-nowrap">{text || 'N/A'}</Flex>
        ),
    },
    // {
    //     title: '  Document Type',

    //     dataIndex: 'documentType',
    //     key: 'documentType',
    //     className: 'ant-table-tbody-ant-table-cell',
    //     render: (text: string) => (
    //         <Flex className="ml-[.125rem] whitespace-nowrap">{text || 'N/A'}</Flex>
    //     ),
    // },
    {
        title: 'Issued Date',

        dataIndex: 'issueDate',
        key: 'issueDate',
        className: 'ant-table-tbody-ant-table-cell',

        render: issueDate => (
            <Typography.Text className="ml-[.125rem] whitespace-nowrap">
                {issueDate ? formatDate(issueDate) : 'N/A'}{' '}
            </Typography.Text>
        ),
    },
    {
        title: 'Expiry Date',

        dataIndex: 'expireDate',
        key: 'expireDate',
        className: 'ant-table-tbody-ant-table-cell',
        render: expireDate => (
            <Typography.Text className="ml-[.125rem] whitespace-nowrap">
                {expireDate ? formatDate(expireDate) : 'N/A'}{' '}
            </Typography.Text>
        ),
    },
    {
        title: ' Status',
        dataIndex: 'status',
        key: 'status',
        className: 'ant-table-tbody-ant-table-cell',
        render: (status, record) => {
            let colorClass = '';
            if (status === '') {
                return 'N/A';
            }
            if (status === 'Active') {
                colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
            } else if (status === 'Expired') {
                colorClass = 'text-[#FDA700] bg-[#FFFBE4]';
            } else if (status === 'Upcoming') {
                colorClass = 'text-[#007BFF] bg-[#E0F3FF]';
            }
            const formattedStatus = formatText(status);
            return record.expireDate ? (
                <span className={`${colorClass} font-normal px-3 py-1 rounded-2xl -ml-[.125rem]`}>
                    {formattedStatus}
                </span>
            ) : (
                <span className="text-[#05BE63] bg-[#DDFFE2] font-normal px-3 py-1 rounded-2xl -ml-[.125rem]">
                    Active
                </span>
            );
        },
    },
    {
        title: '  Actions',

        dataIndex: 'actions',
        key: 'actions',
        width: '10%',
        className: 'ant-table-tbody-ant-table-cell',
        render: (text, record) =>
            record.documentNumber && record.issueDate ? (
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
            ) : (
                <Flex justify="center" className="px-2">
                    <Button
                        type="default"
                        danger
                        className="w-full"
                        size="small"
                        onClick={() => handleEdit(record)}
                    >
                        Update
                    </Button>
                </Flex>
            ),
    },
];
