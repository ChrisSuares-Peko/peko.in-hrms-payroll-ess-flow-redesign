import { DownloadOutlined, EyeOutlined, InfoCircleFilled, InfoCircleOutlined, MailOutlined } from '@ant-design/icons';
import { TableColumnsType, Flex, Avatar, Typography, Tooltip, Badge, Space, Button } from 'antd';
import { BadgeProps } from 'antd/es/badge';
import { ColumnsType } from 'antd/es/table';
import { NavigateFunction } from 'react-router-dom';

import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { filterState, SalaryInfo, SalaryItem, salarytableType } from '../../types/salaryProfileTypes/employeeSalaryTable';

const formatLopDays = (days: number) => (Number.isInteger(days) ? String(days) : days.toFixed(1));

// "Loss of Pay" column, after Gross Income on Salary Details and Run Payroll's Review table:
// the amount with the days under it, or a dash. Gross Income on both pages is already the
// gross after LOP — LOP is unpaid days, not a deduction, so it is never in Total Deductions.
function lossOfPayColumn<T extends { lossOfPayDays?: number; lossOfPayAmount?: number }>(align: 'left' | 'right') {
    return {
        title: (
            <span style={{ whiteSpace: 'nowrap' }}>
                Loss of Pay{' '}
                <Tooltip title="Pay not earned for unpaid days this month. Gross Income is already reduced by it, and PF, ESI and TDS follow the reduced pay.">
                    <InfoCircleOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                </Tooltip>
            </span>
        ),
        dataIndex: 'lossOfPayAmount',
        key: 'lossOfPayAmount',
        align,
        render: (_: unknown, record: T) =>
            record.lossOfPayDays ? (
                <Flex vertical align={align === 'right' ? 'end' : 'start'}>
                    <Typography.Text style={{ color: '#4b5563', whiteSpace: 'nowrap' }}>
                        ₹ {formatNumberWithLocalString(record.lossOfPayAmount || 0)}
                    </Typography.Text>
                    <Typography.Text className="text-xs" style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {formatLopDays(record.lossOfPayDays)} day{record.lossOfPayDays === 1 ? '' : 's'}
                    </Typography.Text>
                </Flex>
            ) : (
                <span style={{ color: '#94a3b8' }}>-</span>
            ),
    };
}

const { Text } = Typography;

function getInitials(name: string): string {
    const words = name.split(' ');
    const initials = words
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 3)
        .toUpperCase();
    return initials;
}

const formatDate = (date: any) => new Date(date).toISOString().split('T')[0];

export const employeeSalaryColumns = (filter: filterState, navigate: NavigateFunction): TableColumnsType<salarytableType> => {
    console.log(filter,"filter");
    
    return [
    {
        title: 'Name & Employee ID',
        dataIndex: 'name',

        render: (text: string, record: salarytableType) => (
            <Flex gap={10} className='cursor-pointer' onClick={()=>navigate(paths.payroll.employeeSalaryProfile,{
                state:{
                    month: filter.month,
                    year: filter.year,
                    eid:record.eId
                }
            })}>
                <Flex align="center">
                    {record.image ? (
                        <Avatar
                            src={record.image}
                            style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}
                        />
                    ) : (
                        <Avatar style={{ backgroundColor: '#fde3cf', color: 'red' }}>
                            {getInitials(text)}
                        </Avatar>
                    )}
                </Flex>
                <Flex vertical justify="center">
                    <Typography.Text className="text-gray-900 text-base ">
                        {/* <Link
                            style={{ color: '#101828', textDecoration: 'none' }}
                            to={`/${paths.payroll.index}/${paths.payroll.employeesSalary}/${paths.payroll.salaryProfile}`}
                            state={{
                                eId: record.eId,
                                salaryId: record.salaryId,
                                month: filter.month,
                                year: filter.year,
                            }}
                        > */}
                        {text}
                        {/* </Link> */}
                        {record?.employeeStatus === 'RESIGNED' ||
                        record?.employeeStatus === 'SUSPENDED' ? (
                            <Tooltip
                                title={`This employee is under notice period. Last working day: ${formatDate(record?.lastWorkingDay)}`}
                            >
                                <InfoCircleFilled
                                    style={{
                                        marginLeft: '8px',
                                        color: '#1890ff',
                                        cursor: 'pointer',
                                    }}
                                />
                            </Tooltip>
                        ) : null}
                    </Typography.Text>

                    <Typography.Text className="text-slate-500 text-sm font-normal">
                        {record?.employeeId}
                    </Typography.Text>
                </Flex>
            </Flex>
        ),
    },

    {
        title: 'Designation & Department',
        dataIndex: 'role',
        // key: Math.random().toString(36).substring(2, 11),
        render: (text: string, record: salarytableType) => (
            <Flex gap={10}>
                <Flex vertical justify="center">
                    <Typography.Text className="  text-gray-900 text-base font-medium">
                        {text}
                    </Typography.Text>
                    <Typography.Text className="text-slate-500 text-sm font-normal">
                        {record.department}
                    </Typography.Text>
                </Flex>
            </Flex>
        ),
    },
    {
        title: <span style={{ whiteSpace: 'nowrap' }}>Gross Income</span>,
        dataIndex: 'monthlySalary',
        align: 'left',
        render: (text: string, record: salarytableType) => (
            <Flex vertical align="start">
                <Typography.Text style={{ color: '#4b5563', whiteSpace: 'nowrap' }}>{text}</Typography.Text>
                {record.oneTimeAmount ? (
                    <Typography.Text className="text-xs" style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        incl. one-time ₹ {formatNumberWithLocalString(record.oneTimeAmount)}
                    </Typography.Text>
                ) : null}
            </Flex>
        ),
    },
    lossOfPayColumn<salarytableType>('left'),
    {
        title: (
            <span style={{ whiteSpace: 'nowrap' }}>
                Total Deductions{' '}
                <Tooltip title="Statutory (PF, ESI, Professional Tax, Labour Welfare Fund), leave deductions and one-time recoveries for this month, excluding TDS.">
                    <InfoCircleOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                </Tooltip>
            </span>
        ),
        dataIndex: 'totalDeduction',
        align: 'left',
        render: (text: string) => <span style={{ whiteSpace: 'nowrap' }}>{text}</span>,
    },
    {
        title: <span style={{ whiteSpace: 'nowrap' }}>Net Salary (before tax)</span>,
        dataIndex: 'netSalaryBeforeTax',
        align: 'left',
        render: (text: string) => <span style={{ whiteSpace: 'nowrap' }}>{text}</span>,
    },
    {
        title: (
            <span style={{ whiteSpace: 'nowrap' }}>
                TDS{' '}
                <Tooltip title="Income tax deducted at source for this month.">
                    <InfoCircleOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                </Tooltip>
            </span>
        ),
        dataIndex: 'tds',
        align: 'left',
        render: (text: string) => <span style={{ whiteSpace: 'nowrap' }}>{text}</span>,
    },
    {
        title: <span style={{ whiteSpace: 'nowrap' }}>Net Salary (after tax)</span>,
        dataIndex: 'totalPayable',
        align: 'left',
        render: (text: string) => (
            <Typography.Text style={{ color: '#111827', whiteSpace: 'nowrap' }} strong>
                {text}
            </Typography.Text>
        ),
    },

    {
        title: 'Status',
        dataIndex: 'status',
        // key: Math.random().toString(36).substring(2, 11),
        render: text => {
            if (text === 'PAID') {
                return (
                    <Badge
                        status="success"
                        text="Paid"
                        className="px-2 rounded-2xl"
                        style={{ backgroundColor: '#ECFDF3', color: '#027A48' }}
                    />
                );
            }
            if (text === 'PENDING') {
                return (
                    <Badge
                        status="error"
                        text="Pending"
                        className="px-2 rounded-2xl"
                        style={{ backgroundColor: '#FFFDD4', color: '#B78912' }}
                    />
                );
            }
            if (text === 'APPROVED') {
                return (
                    <Badge
                        status="success"
                        text="Approved"
                        className="px-1 rounded-2xl"
                        style={{ backgroundColor: '#ECFDF3', color: '#027A48' }}
                    />
                );
            }
            if (text === 'FAILD') {
                return (
                    <Badge
                        status="error"
                        text="Pending"
                        className="px-2 rounded-2xl"
                        style={{ backgroundColor: '#FFF2EA', color: '#F15046' }}
                    />
                );
            }
            if (text === 'UPCOMING') {
                return (
                    <Badge
                        status="warning"
                        text="Upcoming"
                        className="rounded-2xl"
                        // style={{ color: '#FAAD14' }}
                        style={{
                            color: '#FAAD14',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '12px', // Adjust text size
                            padding: '0 4px', // Adjust padding
                        }}
                    />
                );
            }
            return <Badge status="default" text={text} className="px-2 rounded-2xl" />;
        },
        // filters: [
        //     { text: 'PENDING', value: 'PENDING' },
        //     { text: 'PAID', value: 'PAID' },
        //     // { text: 'UPCOMING', value: 'UPCOMING' },
        //     // { text: 'FAILD', value: 'FAILD' },
        // ],
        // onFilter: (value, record) => record.status === value,
    },
]}

const PAID_LIKE_STATUSES = ['paid', 'approved', 'completed'];

const paidOnBadge = (record: { paymentStatus: string; payingDate: string | null }) => {
    const isPaid = PAID_LIKE_STATUSES.includes((record.paymentStatus || '').toLowerCase());
    if (isPaid && record.payingDate) {
        return (
            <Badge
                status="success"
                text={new Date(record.payingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                style={{ backgroundColor: '#ECFDF3', color: '#027A48', padding: '4px 10px', borderRadius: 10 }}
            />
        );
    }
    let statusText = record.paymentStatus;
    if (!statusText || statusText === 'PENDING') {
        statusText = 'Pending';
    } else if (statusText === 'UPCOMING') {
        statusText = 'Upcoming';
    }
    return (
        <Badge
            status="warning"
            text={statusText}
            style={{ backgroundColor: '#FFF6EA', color: '#FFA940', padding: '4px 10px', borderRadius: 10 }}
        />
    );
};

export const payslipColumns = (
    handleDownload: (year: string, month: string) => Promise<void>,
    handleEmail: (year: string, month: string) => Promise<void>
) => [
    {
        title: <Text style={{ fontSize: 13, fontWeight: 700 }}>Month</Text>,
        key: 'month',
        render: (_: any, record: any) => (
            <Text strong>{`${monthNames[record.monthNum - 1] || ''} ${record.yearNum}`}</Text>
        ),
    },
    {
        title: <Text style={{ fontSize: 13, fontWeight: 700 }}>Paid On</Text>,
        key: 'paidOn',
        render: (_: any, record: any) => paidOnBadge(record),
    },
    {
        title: <Text style={{ fontSize: 13, fontWeight: 700 }}>Gross Earnings</Text>,
        dataIndex: 'grossEarnings',
        key: 'grossEarnings',
        align: 'right' as const,
        render: (amount: number, record: any) => (
            <Flex vertical align="end">
                <Text>{formatCurrency(amount)}</Text>
                {record.arrearsAmount > 0 ? (
                    <Tooltip title="A backdated salary increment's arrears, included in this month's payout.">
                        <Text className="text-xs" style={{ color: '#94a3b8' }}>
                            incl. arrears {formatCurrency(record.arrearsAmount)}
                        </Text>
                    </Tooltip>
                ) : null}
            </Flex>
        ),
    },
    {
        title: <Text style={{ fontSize: 13, fontWeight: 700 }}>Total Deductions</Text>,
        dataIndex: 'totalDeductions',
        key: 'totalDeductions',
        align: 'right' as const,
        render: (amount: number) => <Text>{formatCurrency(amount)}</Text>,
    },
    {
        title: <Text style={{ fontSize: 13, fontWeight: 700 }}>Net Paid</Text>,
        dataIndex: 'netPaid',
        key: 'netPaid',
        align: 'right' as const,
        render: (amount: number) => (
            <Text>
                <strong>{formatCurrency(amount)}</strong>
            </Text>
        ),
    },
    {
        title: <Text style={{ fontSize: 13, fontWeight: 700 }}>Action</Text>,
        key: 'action',
        render: (_: any, record: any) => {
            const isPaid = PAID_LIKE_STATUSES.includes((record.paymentStatus || '').toLowerCase());
            const iconColor = isPaid ? '#ff4d4f' : '#cbd5e1';
            return (
                <Space size="middle">
                    <Button
                        type="text"
                        disabled={!isPaid}
                        onClick={() => handleEmail(String(record.yearNum), String(record.monthNum))}
                        icon={<MailOutlined style={{ color: iconColor, fontSize: 16 }} />}
                        style={{ padding: 0 }}
                    />
                    <Button
                        type="text"
                        disabled={!isPaid}
                        onClick={() => handleDownload(String(record.yearNum), String(record.monthNum))}
                        icon={<DownloadOutlined style={{ color: iconColor, fontSize: 16 }} />}
                        style={{ padding: 0 }}
                    />
                </Space>
            );
        },
    },
];

export const monthsArray = [
    // {label:'All',value:null},
    { label: 'January', value: '1' },
    { label: 'February', value: '2' },
    { label: 'March', value: '3' },
    { label: 'April', value: '4' },
    { label: 'May', value: '5' },
    { label: 'June', value: '6' },
    { label: 'July', value: '7' },
    { label: 'August', value: '8' },
    { label: 'September', value: '9' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' },
];
let currentYear = new Date().getFullYear();
currentYear += 1;
export const yearsArray = Array.from({ length: 10 }, (_, index) => {
    const year = (currentYear - index).toString();
    return { label: year, value: year };
});
export const yearsCurrentAndNext = Array.from({ length: 2 }, (_, index) => {
    const year = (currentYear - index).toString();
    return { label: year, value: year };
});

export const years = [
    ...Array.from({ length: 5 }, (_, index) => {
        const year = (currentYear - (5 - index)).toString();
        return { label: year, value: year };
    }),
    ...Array.from({ length: 6 }, (_, index) => {
        const year = (currentYear + index).toString();
        return { label: year, value: year };
    }),
];

export const payrollHistoryDummyData = [
    {
        id: 'ph001',
        createdDate: '08-04-2023',
        month: 'Full Month',
        processedOn: '08-04-2023',
        totalEmployees: 45,
        totalAmount: '₹ 10,000',
        status: 'Paid',
    },
    {
        id: 'ph002',
        createdDate: '08-04-2023',
        month: 'Full Month',
        processedOn: '08-04-2023',
        totalEmployees: 55,
        totalAmount: '₹ 10,000',
        status: 'Paid',
    },
    {
        id: 'ph003',
        createdDate: '08-04-2023',
        month: 'Full Month',
        processedOn: '08-04-2023',
        totalEmployees: 28,
        totalAmount: '₹ 10,000',
        status: 'Paid',
    },
    {
        id: 'ph004',
        createdDate: '08-04-2023',
        month: 'Full Month',
        processedOn: '08-04-2023',
        totalEmployees: 36,
        totalAmount: '₹ 10,000',
        status: 'Paid',
    },
];

export const getPayrollHistoryColumns = (
    handleView: (record: any) => void,
    handleDownload: (record: any) => void,
    downloadingId: string | null = null
): TableColumnsType<any> => [
    {
        title: 'Created Date',
        dataIndex: 'createdDate',
        render: (val: string) => val || 'N/A',
    },
    {
        title: 'Month',
        dataIndex: 'month',
    },
    {
        title: 'Processed On',
        dataIndex: 'processedOn',
        render: (val: string) => val || 'N/A',
    },
    {
        title: 'Total Employees',
        dataIndex: 'totalEmployees',
    },
    {
        title: 'Total Amount',
        dataIndex: 'totalAmount',
    },
    {
        title: 'Salary Status',
        dataIndex: 'status',
        // Matches SalaryStatusBadge's colors (the Employees tab's listing) so the same
        // status reads the same way on both pages — PAID/APPROVED green, PENDING red,
        // everything else (e.g. UPCOMING) amber.
        render: (status: string) => {
            const normalized = status.toLowerCase();
            let badgeStatus: BadgeProps['status'] = 'warning';
            let backgroundColor = '#FFF6EA';
            let color = '#FFA940';
            if (normalized === 'approved' || normalized === 'paid') {
                badgeStatus = 'success';
                backgroundColor = '#ECFDF3';
                color = '#027A48';
            } else if (normalized === 'pending') {
                badgeStatus = 'error';
                backgroundColor = '#FFF1F0';
                color = '#ff4d4f';
            }
            const displayText = status
                ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
                : status;
            return (
                <Badge
                    status={badgeStatus}
                    text={displayText}
                    style={{ backgroundColor, color, padding: '4px 10px', borderRadius: '10px' }}
                />
            );
        },
    },
    {
        title: 'Action',
        key: 'action',
        render: (_: any, record: any) => (
            <Space size="middle">
                <Tooltip title="View">
                    <Button
                        type="text"
                        icon={<EyeOutlined className="text-[#E30000]" />}
                        onClick={() => handleView(record)}
                    />
                </Tooltip>
                <Tooltip title="Download">
                    <Button
                        type="text"
                        icon={<DownloadOutlined className="text-[#E30000]" />}
                        loading={downloadingId === record.id}
                        onClick={() => handleDownload(record)}
                    />
                </Tooltip>
            </Space>
        ),
    },
];

export const monthNames = [
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December',
                ];


export const salaryProfileColumns: ColumnsType<SalaryItem> = [
    {
        title: <Text className='text-[13px] font-[700]'>Component Name</Text>,
        dataIndex: 'componentName',
        key: 'componentName',
        render: (text) => <Text  >{text}</Text>
    },
    {
        title: <Text className='text-[13px] font-[700]'>Category</Text>,
        dataIndex: 'category',
        key: 'category',
        render: (text) => <Text >{text}</Text>
    },
    {
        title: <Text  className='text-[13px] font-[700]'>Amount/Percentage</Text>,
        dataIndex: 'amount',
        key: 'amount',
        render: (text) => <Text >{text}</Text>
    },
];


export const allowanceKeys: (keyof SalaryInfo)[] = [
    'hraAmount',
    'daAmount',
    'bonus',
    'incentiveAmount',
    'increamentAmount',
    'overtimeAmount',
    'other',
];

export const salaryProfileNewColumns = (filter: { month: number; year: number }, navigate: NavigateFunction): ColumnsType<any> => [
        {
            title: 'Name & Employee ID',
            dataIndex: 'name',
            key: 'name',
            render: (_: any, record: any) => (
                <Space
                    size="middle"
                    align="center"
                    className="cursor-pointer"
                    onClick={() =>
                        navigate(
                            `/${paths.payroll.index}/${paths.payroll.employeesSalary}/${paths.payroll.employeeSalaryProfile}`,
                            {
                                state: {
                                    month: filter.month,
                                    year: filter.year,
                                    eid:record.id
                                },
                            }
                        )
                    }
                >
                    <Avatar
                        style={{
                            backgroundColor: '#fee2e2',
                            color: '#ef4444',
                            fontWeight: 500,
                            fontSize: '14px',
                        }}
                        size="large"
                    >
                        {record.initials}
                    </Avatar>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ fontSize: '14px', color: '#1f2937' }}>
                            {record.name}
                            {record.bankDetails.length<1 ? (
                    <Tooltip title="Bank details missing">
                         <InfoCircleOutlined style={{ color: 'red', marginLeft: 4 }} />
                    </Tooltip>
                ) : null}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '13px' }}>
                            {record.employeeId}
                        </Text>
                
                    </div>
                </Space>
            ),
        },
        {
            title: 'Designation & Department',
            dataIndex: 'designation',
            key: 'designation',
            render: (_: any, record: any) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text style={{ fontSize: '14px', color: '#4b5563' }}>{record.designation}</Text>
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                        {record.department}
                    </Text>
                </div>
            ),
        },
        {
            title: <span style={{ whiteSpace: 'nowrap' }}>Gross Income</span>,
            dataIndex: 'grossIncome',
            key: 'grossIncome',
            align: 'right',
            render: (text: any, record: any) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Text style={{ color: '#4b5563', fontSize: '14px', whiteSpace: 'nowrap' }}>{text}</Text>
                    {record.oneTimeAmount ? (
                        <Text className="text-xs" style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            incl. one-time ₹ {formatNumberWithLocalString(record.oneTimeAmount)}
                        </Text>
                    ) : null}
                </div>
            ),
        },
        lossOfPayColumn<any>('right'),
        {
            title: (
                <span style={{ whiteSpace: 'nowrap' }}>
                    Total Deductions{' '}
                    <Tooltip title="Statutory (PF, ESI, Professional Tax, Labour Welfare Fund), leave deductions and one-time recoveries for this month, excluding TDS.">
                        <InfoCircleOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                    </Tooltip>
                </span>
            ),
            dataIndex: 'totalDeductions',
            key: 'totalDeductions',
            align: 'right',
            render: (text: any) => <Text style={{ color: '#4b5563', fontSize: '14px', whiteSpace: 'nowrap' }}>{text}</Text>,
        },
        {
            title: <span style={{ whiteSpace: 'nowrap' }}>Net Salary (before tax)</span>,
            dataIndex: 'netSalaryBeforeTax',
            key: 'netSalaryBeforeTax',
            align: 'right',
            render: (text: any) => <Text style={{ color: '#4b5563', fontSize: '14px', whiteSpace: 'nowrap' }}>{text}</Text>,
        },
        {
            title: (
                <span style={{ whiteSpace: 'nowrap' }}>
                    TDS{' '}
                    <Tooltip title="Income tax deducted at source for this month.">
                        <InfoCircleOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                    </Tooltip>
                </span>
            ),
            dataIndex: 'tds',
            key: 'tds',
            align: 'right',
            render: (text: any) => <Text style={{ color: '#4b5563', fontSize: '14px', whiteSpace: 'nowrap' }}>{text}</Text>,
        },
        {
            title: <span style={{ whiteSpace: 'nowrap' }}>Net Salary (after tax)</span>,
            dataIndex: 'netSalary',
            key: 'netSalary',
            align: 'right',
            render: (text: any) => (
                <Text style={{ color: '#111827', fontSize: '14px', whiteSpace: 'nowrap' }} strong>
                    {text}
                </Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (text: string) => {
                if (text === 'PAID') {
                    return (
                        <Badge
                            status="success"
                            text="Paid"
                            className="px-2 rounded-2xl"
                            style={{ backgroundColor: '#ECFDF3', color: '#027A48' }}
                        />
                    );
                }
                if (text === 'PENDING') {
                    return (
                        <Badge
                            status="error"
                            text="Pending"
                            className="px-2 rounded-2xl"
                            style={{ backgroundColor: '#FFFDD4', color: '#B78912' }}
                        />
                    );
                }
                if (text === 'APPROVED') {
                    return (
                        <Badge
                            status="success"
                            text="Approved"
                            className="px-1 rounded-2xl"
                            style={{ backgroundColor: '#ECFDF3', color: '#027A48' }}
                        />
                    );
                }
                if (text === 'FAILD') {
                    return (
                        <Badge
                            status="error"
                            text="Pending"
                            className="px-2 rounded-2xl"
                            style={{ backgroundColor: '#FFF2EA', color: '#F15046' }}
                        />
                    );
                }
                if (text === 'UPCOMING') {
                    return (
                        <Badge
                            status="warning"
                            text="Upcoming"
                            className="rounded-2xl"
                            style={{
                                color: '#FAAD14',
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '12px',
                                padding: '0 4px',
                            }}
                        />
                    );
                }
                return <Badge status="default" text={text} className="px-2 rounded-2xl" />;
            },
        },
];


export const formatCurrency = (value: number) => `₹ ${formatNumberWithLocalString(value || 0)}`;
