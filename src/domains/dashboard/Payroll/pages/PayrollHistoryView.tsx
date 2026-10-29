import { useState } from 'react';

import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Image, Input, Pagination, Table, Tag, Typography } from 'antd';
import { useLocation } from 'react-router-dom';

import { downloadPayrollHistoryReport } from '@src/domains/dashboard/Payroll/api/salaryHistoryApi/salaryHistoryDetail';
import { useGetPayrollHistoryDetail } from '@src/domains/dashboard/Payroll/hooks/employeeSalaryHooks/useGetPayrollHistoryDetail';
import {
    getPayrollHistoryDetailColumns,
    OneTimePayment,
    PayrollHistoryDetailRecord,
} from '@src/domains/dashboard/Payroll/utils/payrollHistory/columns';
import { payrollHistoryStatCards } from '@src/domains/dashboard/Payroll/utils/payrollHistory/data';
import { useAppSelector } from '@src/hooks/store';
import { useScrollToTop } from '@src/hooks/useScrollToTop';

const { Text } = Typography;

const PayrollHistoryView = () => {
    useScrollToTop();
    const location = useLocation();
    const record = location.state?.record;
    const monthTitle: string = record?.month ?? 'January 2026';
    const monthNumber: number = record?.monthNumber ?? 1;
    const year: number = record?.year ?? new Date().getFullYear();

    const { corporateId } = useAppSelector(state => state.reducer.auth);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [isDownloading, setIsDownloading] = useState(false);
    const PAGE_SIZE = 10;

    const handleDownload = async () => {
        setIsDownloading(true);
        await downloadPayrollHistoryReport(corporateId, monthNumber, year);
        setIsDownloading(false);
    };

    const { rows, isLoading, count, summary } = useGetPayrollHistoryDetail(monthNumber, year, page);

    const filtered = rows.filter(
        r => r.name.toLowerCase().includes(search.toLowerCase()) || r.empId.includes(search)
    );

    const columns = getPayrollHistoryDetailColumns();

    const otpStatusColor: Record<string, string> = {
        SUCCESS: '#03A254',
        FAILED: '#EF4444',
        PENDING: '#F59E0B',
        UPCOMING: '#F59E0B',
    };

    const oneTimePaymentColumns = [
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (val: number) => (
                <Text style={{ fontSize: 13, color: '#1E293B' }}>
                    ₹{(val ?? 0).toLocaleString('en-IN')}
                </Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: (val: string) => (
                <Tag
                    style={{
                        borderRadius: 20,
                        padding: '2px 10px',
                        fontSize: 12,
                        fontWeight: 500,
                        color: otpStatusColor[val] ?? '#42526D',
                        background: '#F5F6F7',
                        border: 'none',
                    }}
                >
                    {val.charAt(0) + val.slice(1).toLowerCase()}
                </Tag>
            ),
        },
        {
            title: 'Reference ID',
            dataIndex: 'referenceId',
            key: 'referenceId',
            render: (val: string | null) => (
                <Text style={{ fontSize: 13, color: '#42526D' }}>{val ?? '—'}</Text>
            ),
        },
        {
            title: 'Remark',
            dataIndex: 'remark',
            key: 'remark',
            render: (val: string | null) => (
                <Text style={{ fontSize: 13, color: '#A1A1AA' }}>{val ?? '—'}</Text>
            ),
        },
        {
            title: 'Initiated At',
            dataIndex: 'initiatedAt',
            key: 'initiatedAt',
            render: (val: string | null) => (
                <Text style={{ fontSize: 13, color: '#42526D' }}>
                    {val
                        ? new Date(val).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                          })
                        : '—'}
                </Text>
            ),
        },
    ];

    const expandedRowRender = (row: PayrollHistoryDetailRecord) => {
        if (!row.oneTimePayments?.length) return null;
        return (
            <Flex vertical gap={8} style={{ padding: '8px 16px 12px' }}>
                <Text style={{ fontSize: 13, fontWeight: 600, color: '#101828' }}>
                    One-time Payments
                </Text>
                <Table
                    columns={oneTimePaymentColumns}
                    dataSource={row.oneTimePayments.map((p: OneTimePayment, i: number) => ({
                        ...p,
                        key: String(i),
                    }))}
                    pagination={false}
                    size="small"
                    style={{ background: '#FAFAFA' }}
                />
            </Flex>
        );
    };

    const statCards = summary
        ? [
              {
                  ...payrollHistoryStatCards[0],
                  value: `₹${Math.abs(summary.totalProcessed).toLocaleString('en-IN')}`,
              },
              {
                  ...payrollHistoryStatCards[1],
                  value: `${summary.totalPaid} employees`,
              },
              {
                  ...payrollHistoryStatCards[2],
                  value: `${summary.totalEmployees - summary.totalPaid} employees`,
              },
          ]
        : payrollHistoryStatCards;

    return (
        <Flex vertical gap={36} style={{ padding: '24px 16px 48px', width: '100%' }}>
            {/* Title section */}
            <Flex justify="space-between" align="center" style={{ height: 40 }}>
                <Text className="text-2xl font-semibold">{monthTitle}</Text>
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    loading={isDownloading}
                    onClick={handleDownload}
                >
                    Download Report
                </Button>
            </Flex>

            {/* Stat cards */}
            <Flex gap={24}>
                {statCards.map((card, i) => (
                    <Flex
                        key={i}
                        vertical
                        gap={14}
                        style={{
                            flex: 1,
                            background: card.bg,
                            borderRadius: 16,
                            padding: '18px 28px',
                        }}
                    >
                        <Flex
                            align="center"
                            justify="center"
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: '50%',
                                background: '#FFFFFF',
                                flexShrink: 0,
                            }}
                        >
                            <Image
                                src={card.icon}
                                alt="stat icon"
                                width={20}
                                height={20}
                                preview={false}
                            />
                        </Flex>
                        <Flex vertical gap={4}>
                            <Text className="text-base font-semibold sm:text-sm md:text-lg whitespace-nowrap sm:min-w-28">
                                {card.value}
                            </Text>
                            <Text>{card.label}</Text>
                        </Flex>
                    </Flex>
                ))}
            </Flex>

            {/* Table section */}
            <Flex vertical gap={24}>
                <Input
                    placeholder="Search by Emp ID or Employee Name"
                    prefix={<SearchOutlined style={{ color: '#CBD5E1' }} />}
                    value={search}
                    onChange={e => {
                        const clean = e.target.value.replace(
                            /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,
                            ''
                        );
                        setSearch(clean);
                    }}
                />

                <Flex
                    vertical
                    style={{
                        background: '#FFFFFF',
                        border: '0.5px solid #EFF1F4',
                        borderRadius: 20,
                        overflow: 'hidden',
                    }}
                >
                    <Table
                        dataSource={filtered}
                        columns={columns}
                        loading={isLoading}
                        pagination={false}
                        rowKey="key"
                        style={{ width: '100%' }}
                        expandable={{
                            expandedRowRender,
                            rowExpandable: row => !!row.oneTimePayments?.length,
                        }}
                    />
                    <Flex justify="end" style={{ padding: '16px 24px' }}>
                        <Pagination
                            current={page}
                            pageSize={PAGE_SIZE}
                            total={count}
                            showSizeChanger={false}
                            onChange={setPage}
                        />
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default PayrollHistoryView;
