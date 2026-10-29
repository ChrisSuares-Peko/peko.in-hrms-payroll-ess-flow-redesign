import { useState } from 'react';

import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Image, Input, Pagination, Table, Typography } from 'antd';
import { useLocation } from 'react-router-dom';

import { downloadSalaryHistoryReport } from '@src/domains/dashboard/Payroll/api/salaryHistoryApi/salaryHistoryDetail';
import { useGetSalaryHistoryDetail } from '@src/domains/dashboard/Payroll/hooks/employeeSalaryHooks/useGetSalaryHistoryDetail';
import {
    DetailRecord,
    getSalaryHistoryDetailColumns,
    oneTimePaymentColumns,
} from '@src/domains/dashboard/Payroll/utils/salaryHistory/columns';
import { statCards as staticStatCards } from '@src/domains/dashboard/Payroll/utils/salaryHistory/data';
import { useAppSelector } from '@src/hooks/store';
import { useScrollToTop } from '@src/hooks/useScrollToTop';

const { Text } = Typography;

const SalaryHistoryDetails = () => {
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
        await downloadSalaryHistoryReport(corporateId, monthNumber, year);
        setIsDownloading(false);
    };

    const { rows, isLoading, count, summary } = useGetSalaryHistoryDetail(monthNumber, year, page);

    const filtered = rows.filter(
        r => r.name.toLowerCase().includes(search.toLowerCase()) || r.empId.includes(search)
    );

    const columns = getSalaryHistoryDetailColumns();

    const expandedRowRender = (row: DetailRecord) => {
        if (!row.oneTimePayments?.length) return null;
        return (
            <Flex vertical gap={8} style={{ padding: '8px 16px 12px' }}>
                <Text style={{ fontSize: 13, fontWeight: 600, color: '#101828' }}>
                    One-time Payments
                </Text>
                <div style={{ width: '100%', overflowX: 'auto' }}>
                    <Table
                        columns={oneTimePaymentColumns}
                        dataSource={row.oneTimePayments.map((p, i) => ({ ...p, key: String(i) }))}
                        pagination={false}
                        size="small"
                        style={{ minWidth: 560, background: '#FAFAFA' }}
                    />
                </div>
            </Flex>
        );
    };

    const statCards = summary
        ? [
              { ...staticStatCards[0], value: `₹${Math.abs(summary.totalProcessed).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
              { ...staticStatCards[1], value: `${summary.totalPaid} employees` },
              { ...staticStatCards[2], value: `${summary.totalEmployees - summary.totalPaid} employees` },
          ]
        : staticStatCards;

    return (
        <Flex vertical gap={36} style={{ padding: '24px 16px 48px', width: '100%' }}>
            {/* Title section */}
            <Flex vertical gap={32}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                    <Text
                       className="text-2xl font-semibold"
                       style={{ flex: '1 1 220px' }}
                    >
                        {monthTitle}
                    </Text>
                    <Button
                        type="primary"
                        danger
                        icon={<DownloadOutlined />}
                        loading={isDownloading}
                        onClick={handleDownload}
                        className="w-full sm:w-auto"
                    >
                        Download report
                    </Button>
                </Flex>
            </Flex>

            {/* Stat cards */}
            <Flex gap={24} wrap="wrap">
                {statCards.map((card, i) => (
                    <Flex
                        key={i}
                        vertical
                        gap={14}
                        style={{
                            flex: '1 1 220px',
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
                            <Text
                                className={` text-base font-semibold sm:text-sm md:text-lg whitespace-nowrap sm:min-w-28`}
                            >
                                {card.value}
                            </Text>
                            <Text

                            // style={{ fontSize: 16, color: '#475569' }}
                            >
                                {card.label}
                            </Text>
                        </Flex>
                    </Flex>
                ))}
            </Flex>

            {/* Table section */}
            <Flex vertical gap={24}>
                {/* Search + Filter */}
                <Flex align="center" gap={16}>
                    <Input
                        placeholder="Search"
                        prefix={<SearchOutlined style={{ color: '#CBD5E1' }} />}
                        value={search}
                        onChange={e => setSearch(e.target.value.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, ''))}
                        style={{ width: '100%' }}
                    />
                </Flex>

                {/* Table card */}
                <Flex
                    vertical
                    style={{
                        background: '#FFFFFF',
                        border: '0.5px solid #EFF1F4',
                        borderRadius: 20,
                        overflow: 'hidden',
                    }}
                >
                    <div style={{ width: '100%', overflowX: 'auto' }}>
                        <Table
                            dataSource={filtered}
                            columns={columns}
                            loading={isLoading}
                            pagination={false}
                            rowKey="key"
                            style={{ minWidth: 760, width: '100%' }}
                            expandable={{
                                expandedRowRender,
                                rowExpandable: row => !!row.oneTimePayments?.length,
                            }}
                        />
                    </div>
                    <Flex className="justify-center sm:justify-end" style={{ padding: '16px 24px' }}>
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

export default SalaryHistoryDetails;
