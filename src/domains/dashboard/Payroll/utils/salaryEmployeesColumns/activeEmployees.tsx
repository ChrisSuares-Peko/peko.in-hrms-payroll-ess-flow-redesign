import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { formatNumberWithLocalString } from '@utils/priceFormat';

const { Text } = Typography;

export interface SalaryEmployee {
    key: string;
    empId: string;
    name: string;
    email: string;
    initials: string;
    avatarBg: string;
    profileImage: string | null;
    salary: number | null;
    accountName: string | null;
    accountNumber: string;
    bankName: string;
    ifscCode: string | null;
    upiId: string | null;
    transactionType: 'NEFT' | 'UPI' | 'IMPS' | 'RTGS' | null;
    bankAccountStatus: 'Approved' | 'Pending Verification' | 'Missing Information';
    beneficiaryStatus: 'Added' | 'Pending' | 'Failed';
    remark: string;
}

export const bankStatusConfig: Record<string, { color: string }> = {
    Approved: { color: '#12B76A' },
    'Pending Verification': { color: '#F59E0B' },
    'Missing Information': { color: '#F04438' },
};

export const beneficiaryStatusConfig: Record<string, { color: string }> = {
    Added: { color: '#12B76A' },
    Pending: { color: '#F59E0B' },
    Failed: { color: '#F04438' },
};

export const getSalaryEmployeesColumns = (
    onUpdate: (record: SalaryEmployee) => void,
): ColumnsType<SalaryEmployee> => [
    {
        title: 'Employee',
        dataIndex: 'name',
        key: 'name',
        width: 200,
        render: (name: string, record) => (
            <Flex align="center" gap={10}>
                {record.profileImage ? (
                    <img
                        src={record.profileImage}
                        alt={record.initials}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0,
                        }}
                    />
                ) : (
                    <Flex
                        align="center"
                        justify="center"
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: record.avatarBg,
                            flexShrink: 0,
                        }}
                    >
                        <Text style={{ fontSize: 13, fontWeight: 600, color: '#FF9F9F' }}>
                            {record.initials}
                        </Text>
                    </Flex>
                )}
                <Flex vertical gap={1}>
                    <Text style={{ fontSize: 14, fontWeight: 500, color: '#101828' }}>{name}</Text>
                    <Text style={{ fontSize: 12, color: '#6B788E' }}>{record.email}</Text>
                </Flex>
            </Flex>
        ),
    },
    {
        title: 'Employee ID',
        dataIndex: 'empId',
        key: 'empId',
        align: 'center' as const,
        render: (empId: string) => (
            <Flex
                align="center"
                justify="center"
                style={{
                    display: 'inline-flex',
                    background: '#F5F6F7',
                    borderRadius: 30,
                    padding: '7px 8px',
                }}
            >
                <Text style={{ fontSize: 14, fontWeight: 500, color: '#091E42', lineHeight: '14px' }}>
                    {empId}
                </Text>
            </Flex>
        ),
    },
    {
        title: (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Rollout Salary<Tooltip title="The salary displayed in this column is the latest salary approved in the Payroll section."><InfoCircleOutlined style={{ fontSize: 13, color: '#8993A4', cursor: 'pointer' }} /></Tooltip>
            </span>
        ),
        dataIndex: 'salary',
        key: 'salary',
        render: (salary: number | null) =>
            salary != null && salary !== 0 ? (
                <Text style={{ fontSize: 14, color: '#42526D' }}>
                    ₹{formatNumberWithLocalString(salary)}
                </Text>
            ) : (
                <Text style={{ fontSize: 13, color: '#8993A4', fontStyle: 'italic' }}>
                    Yet to be computed
                </Text>
            ),
    },
    {
        title: 'Account Holder Name',
        dataIndex: 'accountName',
        key: 'accountName',
        align: 'center' as const,
        render: (accountName: string | null) => (
            <Text style={{ fontSize: 13, color: '#42526D' }}>{accountName || '—'}</Text>
        ),
    },
    {
        title: 'Account Detail',
        dataIndex: 'accountNumber',
        key: 'accountNumber',
        width: 200,
        render: (accountNumber: string, record) =>
            accountNumber ? (
                <Flex vertical gap={2}>
                    <Text style={{ fontSize: 13, color: '#42526D' }}>{accountNumber}</Text>
                    <Text style={{ fontSize: 12, color: '#8993A4' }}>{record.ifscCode || '—'}</Text>
                    <Text style={{ fontSize: 12, color: '#8993A4' }}>{record.bankName}</Text>
                </Flex>
            ) : (
                <Text style={{ fontSize: 14, color: '#8993A4' }}>—</Text>
            ),
    },
    {
        title: 'Transaction Type',
        dataIndex: 'transactionType',
        key: 'transactionType',
        align: 'center' as const,
        render: (type: string | null) =>
            type ? (
                <Tag
                    style={{
                        background: '#F7EEFF',
                        border: '1px solid #ECD3FF',
                        borderRadius: 24,
                        padding: '3px 14px',
                        fontSize: 13,
                        color: '#171717',
                        fontWeight: 400,
                        margin: 0,
                    }}
                >
                    {type}
                </Tag>
            ) : (
                <Text style={{ fontSize: 14, color: '#8993A4' }}>—</Text>
            ),
    },
    {
        title: 'Bank Account Status',
        dataIndex: 'bankAccountStatus',
        key: 'bankAccountStatus',
        align: 'center' as const,
        render: (status: string) => {
            const labelMap: Record<string, string> = {
                approved: 'Completed',
                completed: 'Completed',
                'pending verification': 'Pending',
                pending: 'Pending',
                'missing information': 'Failed',
                failed: 'Failed',
            };
            const labelColorMap: Record<string, string> = {
                Completed: '#12B76A',
                Pending: '#F59E0B',
                Failed: '#F04438',
            };
            const label = labelMap[status?.toLowerCase().trim()] ?? status;
            return (
                <Text
                    style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: labelColorMap[label] ?? '#42526D',
                        textAlign: 'center',
                        display: 'block',
                    }}
                >
                    {label}
                </Text>
            );
        },
    },
    {
        title: 'Beneficiary Status',
        dataIndex: 'beneficiaryStatus',
        key: 'beneficiaryStatus',
        // width: 130,
        render: (status: string) => (
            <span
                style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: beneficiaryStatusConfig[status]?.color ?? '#42526D',
                    textAlign: 'center',
                    display: 'block',
                }}
            >
                {status}
            </span>
        ),
    },
    {
        title: 'Remark',
        dataIndex: 'remark',
        key: 'remark',
        // width: 140,
        render: (remark: string) => (
            <Text style={{ fontSize: 13, color: '#A1A1AA' }}>{remark || '—'}</Text>
        ),
    },
    {
        title: 'Actions',
        key: 'actions',
        
       
        render: (_, record) => (
            <Button
                danger
                style={{
                    borderRadius: 6,
                    fontSize: 13,
                    height: 32,
                    borderColor: '#FF4F4F',
                    color: '#FF4F4F',
                    background: '#FFFFFF',
                }}
                onClick={() => onUpdate(record)}
            >
                Update
            </Button>
        ),
    },
];
