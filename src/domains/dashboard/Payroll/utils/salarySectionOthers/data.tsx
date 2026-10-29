import { CheckOutlined, CloseOutlined, DownloadOutlined, DeleteOutlined, EditOutlined, EyeOutlined, MoreOutlined } from '@ant-design/icons';
import { TableProps, Space, Button, Typography, Tag, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { bonusTable } from '../../types/salaryProfileTypes/bonustypes';
import { incentiveTable } from '../../types/salaryProfileTypes/incentiveTypes';
import { overtimeTable } from '../../types/salaryProfileTypes/overtimeTypes';
import { reimbursementTableType } from '../../types/salaryProfileTypes/ReimbursementTypes';

const formatText = (text: string | number) => {
    if (!text) return '';
    const stringText = String(text); // Convert any input to a string
    return stringText.charAt(0).toUpperCase() + stringText.slice(1).toLowerCase();
};

// UNPAID and REJECTED render red; APPROVED/PAID render green.
const reimbursementStatusStyle = (paymentStatus: string | number) => {
    const isRed = ['unpaid', 'rejected'].includes(String(paymentStatus).toLowerCase());
    return {
        color: isRed ? '#cf1322' : '#237804',
        backgroundColor: isRed ? '#fff1f0' : '#f6ffed',
        borderColor: isRed ? '#ffa39e' : '#b7eb8f',
    };
};
export const incentiveColumn = (
    handleDelete: (record: incentiveTable) => void,
    handleEdit: (record: incentiveTable) => void
): TableProps<incentiveTable>['columns'] => [
    {
        title: <Typography.Text>Date Added</Typography.Text>,
        dataIndex: 'dateAdded',
        key: 'dateAdded',
    },
    {
        title: <Typography.Text>Effective Month</Typography.Text>,
        dataIndex: 'effectiveMonth',
        key: 'effectiveMonth',
        render: effectiveMonth =>
            new Date(effectiveMonth).toLocaleString('en-US', { month: 'long' }),
    },
    {
        title: <Typography.Text>Incentives Amount</Typography.Text>,
        dataIndex: 'incentiveAmount',
        key: 'incentiveAmount',
        render: text =>
            `₹ ${parseFloat(text)
                .toFixed(2)
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
    },

    {
        title: <Typography.Text>Details</Typography.Text>,
        dataIndex: 'details',
        key: 'details',
    },
    {
        title: <Typography.Text>Action</Typography.Text>,
        dataIndex: 'action',
        key: 'action',
        render: (text, record) => (
            <Space size="middle">
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

export const bonusColumn = (
    handleDelete: (id: bonusTable) => void,
    handleEdit: (id: bonusTable) => void
): TableProps<bonusTable>['columns'] => [
    {
        title: <Typography.Text>Date Added</Typography.Text>,
        dataIndex: 'dateAdded',
        key: 'dateAdded',
    },
{
        title: <Typography.Text>Effective Date</Typography.Text>,
        dataIndex: 'effectiveMonth',
        key: 'effectiveMonth',
        render: bonusDate => dayjs(bonusDate).format('DD-MM-YYYY'),
    },
    {
        title: <Typography.Text>Salary Month</Typography.Text>,
        dataIndex: 'effectiveMonth',
        key: 'effectiveMonth',
        render: bonusDate => new Date(bonusDate).toLocaleString('en-US', { month: 'long' }),
    },

    {
        title: <Typography.Text>Bonus Amount</Typography.Text>,
        dataIndex: 'bonusAmount',
        key: 'bonusAmount',
        render: text =>
            `₹ ${parseFloat(text)
                .toFixed(2)
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
    },
    {
        title: <Typography.Text>Action</Typography.Text>,
        dataIndex: 'action',
        key: 'action',
        render: (text, record) => (
            <Space size="middle">
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
export const overtimeColumn = (
    handleDelete: (record: overtimeTable) => void,
    handleEdit: (record: overtimeTable) => void
): TableProps<overtimeTable>['columns'] => [
    {
        title: <Typography.Text>Date Added</Typography.Text>,
        dataIndex: 'dateAdded',
        key: 'dateAdded',
    },
    {
        title: <Typography.Text>Effective Date</Typography.Text>,
        dataIndex: 'effectiveDate',
        key: 'effectiveDate',
    },
    {
        title: <Typography.Text>Salary Month</Typography.Text>,
        dataIndex: 'salaryMonth',
        key: 'salaryMonth',
        render: overTimeDate => new Date(overTimeDate).toLocaleString('en-US', { month: 'long' }),
    },
    {
        title: <Typography.Text>Total Working Hours</Typography.Text>,
        dataIndex: 'totalWorkingHours',
        key: 'totalWorkingHours',
    },
    {
        title: <Typography.Text>Extra Hours</Typography.Text>,
        dataIndex: 'extraHours',
        key: 'extraHours',
    },
    {
        title: <Typography.Text>Over Time Amount</Typography.Text>,
        dataIndex: 'overTimeAmount',
        key: 'overTimeAmount',
        render: text =>
            `₹ ${parseFloat(text)
                .toFixed(2)
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
    },
    {
        title: <Typography.Text>Over Time Rate</Typography.Text>,
        dataIndex: 'overTimeRate',
        key: 'overTimeRate',
    },
    {
        title: <Typography.Text>Action</Typography.Text>,
        dataIndex: 'action',
        key: 'action',
        width: '10%',
        render: (text, record) => (
            <Space size="middle">
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
export const reimbursementColumn = (
    handleDelete: (id: reimbursementTableType) => void,
    handleEdit: (id: reimbursementTableType) => void,
    handleApprove?: (record: reimbursementTableType) => void,
    handleReject?: (record: reimbursementTableType) => void,
    onViewDocument?: (url: string) => void
): TableProps<reimbursementTableType>['columns'] => [
    {
        title: <Typography.Text>Expense Date</Typography.Text>,
        dataIndex: 'expenseDate',
        key: 'expenseDate',
    },
    {
        title: <Typography.Text>Expense Details</Typography.Text>,
        dataIndex: 'expenseDetails',
        key: 'expenseDetails',
    },
    {
        title: <Typography.Text>Amount Paid</Typography.Text>,
        dataIndex: 'amountPaid',
        key: 'amountPaid',
        render: text =>
            `₹ ${parseFloat(text)
                .toFixed(2)
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
    },

    {
        title: <Typography.Text>Status</Typography.Text>,
        dataIndex: 'paymentStatus',
        key: 'paymentStatus',
        render: text => {
            // Apply formatText function to format the status
            const formattedText = formatText(text);
            const statusStyle = reimbursementStatusStyle(text);
            return (
                <Tag
                    color={statusStyle.color}
                    style={{
                        color: statusStyle.color,
                        backgroundColor: statusStyle.backgroundColor, // light red / light green
                        border: `1px solid ${statusStyle.borderColor}`,
                        borderRadius: 50,
                        height: '22px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingInline: 10,
                        width: 'fit-content',
                    }}
                >
                    ● {formattedText}
                </Tag>
            );
        },
    },

    {
        title: <Typography.Text>Action</Typography.Text>,
        dataIndex: 'action',
        key: 'action',
        width: 180,
        render: (text, record) => {
            const menuItems: MenuProps['items'] = [
                ...(record.supportingDocs && record.supportingDocs !== 'NA'
                    ? [
                          {
                              key: 'view',
                              icon: <EyeOutlined />,
                              label: 'View Document',
                              onClick: () => onViewDocument?.(record.supportingDocs),
                          },
                      ]
                    : []),
                ...((record.status || '').toLowerCase().includes('cancel')
                    ? []
                    : [
                          {
                              key: 'edit',
                              label: 'Edit',
                              icon: <EditOutlined />,
                              onClick: () => handleEdit(record),
                          },
                      ]),
                {
                    key: 'delete',
                    label: 'Delete',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => handleDelete(record),
                },
            ];

            const isUnpaid =
                (record.paymentStatus || '').toUpperCase() === 'UNPAID' &&
                !(record.status || '').toLowerCase().includes('cancel');

            return (
                <div className="flex items-center gap-2">
                    {isUnpaid && (
                        <div className="flex flex-col gap-1">
                            <Button
                                size="small"
                                icon={<CheckOutlined />}
                                style={{ color: '#027A48', borderColor: '#027A48', borderRadius: 6 }}
                                onClick={() => handleApprove?.(record)}
                            >
                                Approve
                            </Button>
                            <Button
                                size="small"
                                icon={<CloseOutlined />}
                                style={{ color: '#CF4C00', borderColor: '#CF4C00', borderRadius: 6 }}
                                onClick={() => handleReject?.(record)}
                            >
                                Reject
                            </Button>
                        </div>
                    )}
                    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                        <Button type="text" icon={<MoreOutlined />} size="small" />
                    </Dropdown>
                </div>
            );
        },
    },
];

export const AllReimbursementColumn = (
    handleDelete: (id: reimbursementTableType) => void,
    handleEdit: (id: reimbursementTableType) => void,
    handleApprove?: (record: reimbursementTableType) => void,
    handleReject?: (record: reimbursementTableType) => void,
    onViewDocument?: (url: string) => void,
    onDownloadDocument?: (record: reimbursementTableType) => void
): TableProps<reimbursementTableType>['columns'] => [
    {
        title: <Typography.Text>Employee Name & ID</Typography.Text>,
        dataIndex: 'employeeName',
        key: 'employeeName',
        render: (_: any, record: any) => {
            const formattedName =
                record.employeeName.charAt(0).toUpperCase() + record.employeeName.slice(1);

            return (
                <div>
                    <Typography.Text>{formattedName}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary">{record.employeeCode}</Typography.Text>
                </div>
            );
        },
    },
    {
        title: <Typography.Text>Expense Date</Typography.Text>,
        dataIndex: 'expenseDate',
        key: 'expenseDate',
    },
    {
        title: <Typography.Text>Expense Details</Typography.Text>,
        dataIndex: 'expenseDetails',
        key: 'expenseDetails',
    },
    {
        title: <Typography.Text>Amount Paid</Typography.Text>,
        dataIndex: 'amountPaid',
        key: 'amountPaid',
        render: text => `₹ ${formatNumberWithLocalString(text)}`,
    },
    {
        title: <Typography.Text>Status</Typography.Text>,
        dataIndex: 'paymentStatus',
        key: 'status',
        render: text => {
            const formattedText = formatText(text);
            const statusStyle = reimbursementStatusStyle(text);
            return (
                <Tag
                    color={statusStyle.color}
                    style={{
                        backgroundColor: statusStyle.backgroundColor, // light red / light green
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.borderColor}`,
                        borderRadius: 50,
                        height: '22px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingInline: 10,
                        width: 'fit-content',
                    }}
                >
                    ● {formattedText}
                </Tag>
            );
        },
    },
    {
        title: <Typography.Text>Document</Typography.Text>,
        dataIndex: 'invoice',
        key: 'invoice',
        render: (text: any, record: any) => (
                <Button
                    className="border-0"
                    disabled={record.invoice === 'NA'}
                    onClick={() => onDownloadDocument?.(record)}
                >
                    <DownloadOutlined
                        className={`text-green-400 ${record.invoice === 'NA' ? 'opacity-50' : ''}`}
                    />
                </Button>
            ),
    },
    {
        title: <Typography.Text>Action</Typography.Text>,
        dataIndex: 'action',
        key: 'action',
        width: 180,
        render: (text, record) => {
            const menuItems: MenuProps['items'] = [
                ...(record.supportingDocs
                    ? [
                          {
                              key: 'view',
                              icon: <EyeOutlined />,
                              label: 'View Document',
                              onClick: () => onViewDocument?.(record.supportingDocs),
                          },
                      ]
                    : []),
                ...((record.status || '').toLowerCase().includes('cancel')
                    ? []
                    : [
                          {
                              key: 'edit',
                              label: 'Edit',
                              icon: <EditOutlined />,
                              onClick: () => handleEdit(record),
                          },
                      ]),
                {
                    key: 'delete',
                    label: 'Delete',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => handleDelete(record),
                },
            ];

            const isUnpaid =
                (record.paymentStatus || '').toUpperCase() === 'UNPAID' &&
                !(record.status || '').toLowerCase().includes('cancel');

            return (
                <div className="flex items-center gap-2">
                    {isUnpaid && (
                        <div className="flex flex-col gap-1">
                            <Button
                                size="small"
                                icon={<CheckOutlined />}
                                style={{ color: '#027A48', borderColor: '#027A48', borderRadius: 6 }}
                                onClick={() => handleApprove?.(record)}
                            >
                                Approve
                            </Button>
                            <Button
                                size="small"
                                icon={<CloseOutlined />}
                                style={{ color: '#CF4C00', borderColor: '#CF4C00', borderRadius: 6 }}
                                onClick={() => handleReject?.(record)}
                            >
                                Reject
                            </Button>
                        </div>
                    )}
                    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                        <Button type="text" icon={<MoreOutlined />} size="small" />
                    </Dropdown>
                </div>
            );
        },
    },
];
