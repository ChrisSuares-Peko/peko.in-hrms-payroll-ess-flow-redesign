import { DownloadOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { TableProps, Typography, Space, Button, Flex } from 'antd';
import moment from 'moment';

import RenderDocument from '@components/molecular/Text/RenderDocument';

import { assetTable } from '../../types/docAndAssetsTypes';
import { EmployeeDocument } from '../../types/type';

const formatText = (text: string | number) => {
    if (!text) return '';
    const stringText = String(text); // Convert any input to a string
    return stringText.charAt(0).toUpperCase() + stringText.slice(1).toLowerCase();
};
export const Documentcolumns = (
    handleDelete: (row: any) => void,
    handleEdit: (row: any) => void,
    showEmployeeNameColumn: boolean
): TableProps<EmployeeDocument>['columns'] => [
    {
        title: <Typography.Text >Date Added</Typography.Text>,
        dataIndex: 'createdAt',
        key: 'date',
        render: date => moment(date).format('YYYY-MM-DD'),
    },

    ...(showEmployeeNameColumn
        ? [
              {
                  title: <Typography.Text >Employee Name</Typography.Text>,
                  dataIndex: 'employeeName',
                  key: 'employeeName',
              },
          ]
        : []),

    {
        title: <Typography.Text >Document Name</Typography.Text>,
        dataIndex: 'name',
        key: 'name',
    },

    {
        title: <Typography.Text >Expiry Date</Typography.Text>,
        dataIndex: 'expiryDate',
        key: 'expiryDate',
        render: text => text ? moment(text).format('YYYY-MM-DD') : 'NA',
    },
    {
        title: <Typography.Text >Download</Typography.Text>,
        dataIndex: 'url',
        key: 'url',
        render: (text) =>  <RenderDocument
                doc={text}
                label={<DownloadOutlined
                            className={`text-green-400 ${text === 'NA' ? 'opacity-50' : ''}`}
                        />}
                        
                />,
    },
     {
        title: <Typography.Text >Delete</Typography.Text>,
        dataIndex: 'url',
        key: 'url',
        render: (text,record) =>  <Button className="border-0" onClick={() => handleDelete(record)}>
                    <DeleteOutlined className="text-[#E30000]" />
                </Button>,
    },
    {
        title: <Typography.Text >Edit</Typography.Text>,
        dataIndex: 'url',
        key: 'url',
        render: (text,record) =>  <Button className="border-0" onClick={() => handleEdit(record)}>
                    <EditOutlined className="text-[#E30000]" />
                </Button>,
    },
    // {
    //     title: <Typography.Text>Action</Typography.Text>,
    //     dataIndex: 'action',
    //     key: 'action',
    //     render: (text, record, index) => (
    //         <Space size="middle">
    //             {/* <a href={record?.url} target="_blank" rel="noopener noreferrer" download>
    //                 <Button className="border-0" disabled={record?.url === 'NA'}>
    //                     <DownloadOutlined
    //                         className={`text-green-400 ${record?.url === 'NA' ? 'opacity-50' : ''}`}
    //                     />
    //                 </Button>
    //             </a> */}
    //             <RenderDocument
    //             doc={record?.url}
    //             label={<DownloadOutlined
    //                         className={`text-green-400 ${record?.url === 'NA' ? 'opacity-50' : ''}`}
    //                     />}
                        
    //             />
    //             <Button className="border-0" onClick={() => handleDelete(record)}>
    //                 <DeleteOutlined className="text-[#E30000]" />
    //             </Button>
    //             <Button className="border-0" onClick={() => handleEdit(record)}>
    //                 <EditOutlined className="text-[#E30000]" />
    //             </Button>
    //         </Space>
    //     ),
    // },
];

export const Assetcolumns = (
    handleDelete: (id: assetTable) => void,
    handleEdit: (row: assetTable) => void
): TableProps<assetTable>['columns'] => [
    {
        title: <Typography.Text>Date Added</Typography.Text>,
        dataIndex: 'createdAt',
        key: 'date',
        render: text => moment(text).format('YYYY-MM-DD'),
    },
    {
        title: <Typography.Text>Asset Name</Typography.Text>,
        dataIndex: 'assetName',
        key: 'assetName',
    },
    {
        title: <Typography.Text>Asset Type</Typography.Text>,
        dataIndex: 'assetType',
        key: 'assetType',
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
        render: text => moment(text).format('YYYY-MM-DD'),
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
export const employeeSalaryCompColumn = (
    handleEdit: (id: any) => void,
    handleDelete: (id: any) => void,
    calculationBasedOnMap: Record<string, string> = {}
): TableProps<any>['columns'] => [
    {
        title: <Typography.Text>Date Added</Typography.Text>,
        dataIndex: 'createdAt',
        key: 'date',
        render: text => moment(text).format('YYYY-MM-DD'),
    },
    {
        title: 'Component Name',
        dataIndex: 'componentName',
    },
    {
        title: 'Calculation Type',
        dataIndex: 'calculationType',
        render: calculationType => formatText(calculationType),
    },
    {
        title: 'Amount/Percentage',
        key: 'amountPercentage',
        render: (text, record) => {
            if (record.calculationType === 'FIXED') {
                const amount = record.amountPercentage || 0;
                return new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                }).format(amount);
            }
            if (record.calculationType === 'PERCENTAGE') {
                const baseLabel = calculationBasedOnMap[record.calculationBasedOn] || '';
                return record.amountPercentage
                    ? `${record.amountPercentage}% of ${(baseLabel)}`
                    : '0';
            }
            return '0';
        },
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: status => {
            let colorClass = '';

            if (status === 'ACTIVE') {
                colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
            } else if (status === 'INACTIVE') {
                colorClass = 'text-[#FDA700] bg-[#FFFBE4]';
            }

            const formattedStatus = formatText(status);

            return (
                <span className={`${colorClass} font-normal px-3 py-1 rounded-2xl -ml-[.125rem]`}>
                    {formattedStatus}
                </span>
            );
        },
    },
    {
        title: 'Action',
        dataIndex: 'action',
        key: 'action',
        width: '10%',
        className: 'ant-table-tbody-ant-table-cell',
        render: (text, record: any) => {
            const isAmountZero = record.amount === 0;

            return isAmountZero ? (
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
            ) : (
                <Space size="middle">
                    {record.componentName !== 'Basic Salary' &&
                        record.componentName !== 'House Rent Allowance' && (
                            <Button className="border-0">
                                <DeleteOutlined
                                    className="text-[#E30000]"
                                    onClick={() => handleDelete(record)}
                                />
                            </Button>
                        )}

                    <Button className="border-0">
                        <EditOutlined
                            className="text-[#E30000]"
                            onClick={() => handleEdit(record)}
                        />
                    </Button>
                </Space>
            );
        },
    },
];

export function getInitials(name: any): string {
    const words = name.split(' ');
    const initials = words
        .map((word: any) => word.charAt(0))
        .join('')
        .substring(0, 3)
        .toUpperCase();
    return initials;
}

export const dataPanAadhar = [
    {
        title: '1234-5678-9012-3456',
        subTitle: 'Aadhar Number',
    },
    {
        title: 'ABCDE1234F',
        subTitle: 'PAN Number',
    },
];
