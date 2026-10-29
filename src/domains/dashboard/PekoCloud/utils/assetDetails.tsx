import { DeleteOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons';
import { Avatar, Button, Flex, Space, Spin, TableProps, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import balanceSheet from '@domains/dashboard/PekoCloud/assets/icons/balanceSheet.svg';

import { formatDate } from './helperFunctions';

const formatText = (text: string | number) => {
    if (!text) return '';
    const stringText = String(text); // Convert any input to a string
    return stringText.charAt(0).toUpperCase() + stringText.slice(1).toLowerCase();
};

function getInitials(name: any): string {
    const words = name.split(' ');
    const initials = words
        .map((word: any) => word.charAt(0))
        .join('')
        .substring(0, 3)
        .toUpperCase();
    return initials;
}

export const assetsUsageHistoryColumn = (
    handleDelete: (record: any) => void,
    handleEdit: (record: any) => void
): TableProps<any>['columns'] => [
    {
        title: 'Employee',
        dataIndex: 'employee',
        key: 'employee',
        render: (text: string, record: any) => (
            <Flex gap={10}>
                <Flex align="center">
                    <Avatar style={{ backgroundColor: '#fde3cf', color: 'red' }}>
                        {getInitials(text || 'N A')}
                    </Avatar>
                </Flex>
                <Flex vertical justify="center">
                    <Typography.Text className="text-base font-medium text-gray-900">
                        {text || 'N/A'}
                    </Typography.Text>
                    <Typography.Text className="text-sm font-normal text-slate-500">
                        {record?.employeeEmail}
                    </Typography.Text>
                </Flex>
            </Flex>
        ),
    },
    // {
    //     title: 'Department',
    //     dataIndex: 'department',
    //     key: 'department',
    // },
    {
        title: 'Assigned Date',
        dataIndex: 'assignDate',
        key: 'assignDate',
        render: assignDate => formatDate(assignDate),
    },
    {
        title: 'Returned Date',
        dataIndex: 'returnDate',
        key: 'returnDate',
        render: returnDate => (
            <Typography.Text>{returnDate ? formatDate(returnDate) : 'N/A'}</Typography.Text>
        ),
    },
    {
        title: 'Return Status',
        dataIndex: 'returnStatus',
        key: 'returnStatus',
        render: text => <Typography.Text>{text ? `${text}` : 'N/A'}</Typography.Text>,
    },
    {
        title: 'Remarks',
        dataIndex: 'remarks',
        key: 'remarks',
        render: text => <Typography.Text>{text ? `${text}` : 'N/A'}</Typography.Text>,
    },
    // {
    //     title: 'Status',
    //     dataIndex: 'status',
    //     key: 'status',
    //     render: status => {
    //         let colorClass = '';
    //         if (status === 'ACTIVE' || status === 'AVAILABLE') {
    //             colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
    //         } else if (status === 'IN USE') {
    //             colorClass = 'text-[#FDA700]';
    //         }
    //         const formattedStatus = formatText(status);
    //         return (
    //             <Typography.Text className={`${colorClass} font-normal px-3 py-1 rounded-2xl`}>
    //                 {formattedStatus}
    //             </Typography.Text>
    //         );
    //     },
    // },
    {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        width: '10%',
        render: (text, record) => (
            <Space>
                <Button type="link" className="border-0" onClick={() => handleEdit(record)}>
                    <EditOutlined className="text-[#E30000]" />
                </Button>
                <Button type="link" className="border-0" onClick={() => handleDelete(record)}>
                    <DeleteOutlined className="text-[#E30000]" />
                </Button>
            </Space>
        ),
    },
];

export const assetsDocumentsColumn = (
    handleDelete: (record: any) => void,
    handleEdit: (record: any) => void,
    handleDocDownload: (record: any) => void,
    loadingRows: any
): TableProps<any>['columns'] => [
    {
        title: 'Document Name',
        dataIndex: 'documentName',
        key: 'documentName',
        render: (documentType: string, record: any) => (
            <Flex gap={10}>
                <Flex align="center">
                    <ReactSVG src={balanceSheet} />
                </Flex>
                <Flex vertical justify="center">
                    <Typography.Text className="text-gray-900 text-normal   whitespace-nowrap">
                        {documentType}
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
        title: 'Issued Date',
        dataIndex: 'issueDate',
        key: 'issueDate',
        render: issueDate => (
            <Typography.Text className="whitespace-nowrap">
                {issueDate ? formatDate(issueDate) : ''}
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
            return record?.expireDate ? (
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
        render: (text, record) =>
            record.documentNumber && record.issueDate ? (
                <Space>
                    {/* <a href={record.document} target="_blank" rel="noopener noreferrer" download> */}
                    <Button
                        onClick={() => handleDocDownload(record)}
                        type="link"
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
                    {/* </a> */}
                    <Button type="link" className="border-0">
                        <EditOutlined
                            className="text-[#E30000]"
                            onClick={() => handleEdit(record)}
                        />
                    </Button>
                    <Button type="link" className="border-0">
                        <DeleteOutlined
                            className="text-[#E30000]"
                            onClick={() => handleDelete(record)}
                        />
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

export const retrieveAssetData = (data: string | number | null | undefined | false) => {
    if (data === null) return 'N/A';
    if (data === '') return 'N/A';
    if (data === undefined) return 'N/A';
    if (data === false) return 'N/A';
    return data;
};
