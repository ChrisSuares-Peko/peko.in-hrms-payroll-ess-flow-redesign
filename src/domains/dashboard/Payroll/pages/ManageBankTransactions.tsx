import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Typography, message } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import dayjs, { Dayjs } from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import useGetVirtualAccountStatement from '@domains/dashboard/paymentLinks/hooks/useGetVirtualAccountStatement';
import type { VirtualAccountStatementApiRow } from '@domains/dashboard/paymentLinks/types/paymentLinkTypes';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const RED = '#FF4F4F';
const VALUE_COLOR = '#1e293b';
const LABEL_COLOR = '#64748b';

const escapeCsvValue = (value: string | number | null | undefined) => {
    const stringValue = value === null || value === undefined ? '—' : String(value);
    return `"${stringValue.replace(/"/g, '""')}"`;
};

const ManageBankTransactions = () => {
    const dispatch = useAppDispatch();
    const {
        rows,
        isLoading,
        dateRange,
        setDateRange,
        page,
        setPage,
    } = useGetVirtualAccountStatement();

    const handleDateRangeChange = (vals: [Dayjs | null, Dayjs | null] | null) => {
        if (vals?.[0] && vals?.[1]) {
            setDateRange([vals[0].startOf('day'), vals[1].endOf('day')]);
            setPage(1);
        }
    };

    const handleDownloadCsv = () => {
        if (isLoading) return;

        if (rows.length === 0) {
            dispatch(showToast({ variant: 'error', description: 'No transactions available to download' }));
            return;
        }

        const headers = ['Description', 'Date & Time', 'Transaction ID', 'Payment Mode', 'Amount', 'Type'];
        const csvRows = rows.map(row => [
            row.description || '—',
            row.dateTime ? dayjs(row.dateTime).format('YYYY-MM-DD HH:mm') : '—',
            row.transactionId || '—',
            row.paymentMode || '—',
            row.amount ?? '—',
            row.type || '—',
        ].map(escapeCsvValue).join(','));
        const csv = [headers.map(escapeCsvValue).join(','), ...csvRows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const [from, to] = dateRange;

        link.href = url;
        link.download = `virtual-account-transactions-${from.format('YYYY-MM-DD')}-to-${to.format('YYYY-MM-DD')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const columns: ColumnsType<VirtualAccountStatementApiRow> = [
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (val: string | null) => (
                <Text style={{ fontSize: 'clamp(12px, 0.88vw, 14px)', color: VALUE_COLOR }}>{val || '—'}</Text>
            ),
        },
        {
            title: 'Date & Time',
            dataIndex: 'dateTime',
            key: 'dateTime',
            render: (val: string | null) => (
                <Text style={{ fontSize: 'clamp(12px, 0.88vw, 14px)', color: VALUE_COLOR }}>
                    {val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '—'}
                </Text>
            ),
        },
        {
            title: 'Transaction ID',
            dataIndex: 'transactionId',
            key: 'transactionId',
            render: (val: string | null) => (
                <Flex align="center" gap={6}>
                    <Text style={{ fontSize: 'clamp(12px, 0.88vw, 14px)', color: VALUE_COLOR }}>{val || '—'}</Text>
                    {val && (
                        <CopyOutlined
                            style={{ fontSize: 13, color: LABEL_COLOR, cursor: 'pointer' }}
                            onClick={() => {
                                navigator.clipboard.writeText(val);
                                message.success('Copied');
                            }}
                        />
                    )}
                </Flex>
            ),
        },
        {
            title: 'Payment Mode',
            dataIndex: 'paymentMode',
            key: 'paymentMode',
            render: (val: string | null) => (
                <Text style={{ fontSize: 'clamp(12px, 0.88vw, 14px)', color: VALUE_COLOR }}>{val || '—'}</Text>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (val: number | null, record: VirtualAccountStatementApiRow) => {
                const isCredit = record.type === 'credit';
                return (
                    <Text style={{
                        fontSize: 'clamp(12px, 0.88vw, 14px)',
                        fontWeight: 600,
                        color: isCredit ? '#43b75d' : RED,
                    }}>
                        {isCredit ? '+' : '-'}₹{(val ?? 0).toLocaleString('en-IN')}
                    </Text>
                );
            },
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (val: string | null) => {
                const isCredit = val === 'credit';
                return (
                    <span style={{
                        display: 'inline-block',
                        padding: '3px 12px',
                        borderRadius: 999,
                        background: isCredit ? '#ecfdf5' : '#fef2f2',
                        color: isCredit ? '#43b75d' : RED,
                        fontSize: 'clamp(11px, 0.8vw, 13px)',
                        fontWeight: 500,
                        textTransform: 'capitalize',
                    }}>
                        {val || '—'}
                    </span>
                );
            },
        },
    ];

    return (
        <div style={{ padding: 'clamp(16px, 2vw, 32px)', maxWidth: 1600 }}>
            {/* Header */}
            <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
                <Flex vertical gap={4}>
                    <Text style={{ fontSize: 'clamp(20px, 1.6vw, 28px)', fontWeight: 700, color: VALUE_COLOR }}>
                        Transactions
                    </Text>
                    <Text style={{ fontSize: 'clamp(12px, 0.9vw, 15px)', color: LABEL_COLOR }}>
                        All transactions across your virtual bank account
                    </Text>
                </Flex>
                <Button
                    icon={<DownloadOutlined />}
                    loading={isLoading}
                    disabled={isLoading}
                    onClick={handleDownloadCsv}
                    style={{
                        height: 38,
                        borderRadius: 8,
                        background: RED,
                        borderColor: RED,
                        color: '#fff',
                        fontWeight: 500,
                        fontSize: 'clamp(12px, 0.88vw, 14px)',
                    }}
                >
                    Download CSV
                </Button>
            </Flex>

            {/* Table card */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 'clamp(14px, 1.05vw, 18px)', fontWeight: 600, color: VALUE_COLOR }}>
                        All Transactions
                    </Text>
                    <RangePicker
                        value={dateRange}
                        onChange={handleDateRangeChange}
                        style={{ borderRadius: 8, height: 36 }}
                        placeholder={['Start date', 'End date']}
                    />
                </Flex>

                <GenericTable
                    dataSource={rows}
                    loading={isLoading}
                    columns={columns}
                    rowKey="key"
                    pagination={{
                        current: page,
                        pageSize: 20,
                        showSizeChanger: false,
                        onChange: setPage,
                    }}
                />
            </div>
        </div>
    );
};

export default ManageBankTransactions;
