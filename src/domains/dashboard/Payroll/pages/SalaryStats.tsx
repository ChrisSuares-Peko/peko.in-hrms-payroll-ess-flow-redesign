import { useState } from 'react';


import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Pagination, Typography } from 'antd';

import GenericTable from '@src/components/atomic/GenericTable';
import { useScrollToTop } from '@src/hooks/useScrollToTop';

import { useExportSalaryStats } from '../hooks/employeeSalaryHooks/useExportSalaryStats';
import { useGetSalaryStats } from '../hooks/employeeSalaryHooks/useGetSalaryStats';
import { YEARS, salaryStatsColumns } from '../utils/salaryStats';

const { Text } = Typography;

const SalaryStats = () => {
    useScrollToTop();
    const [tab, setTab] = useState<'1' | '2'>('1');
    const [activeYear, setActiveYear] = useState('2026');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const { exportSalaryStats, isExporting } = useExportSalaryStats();

    const status: 'ACTIVE' | 'PAST' = tab === '1' ? 'ACTIVE' : 'PAST';

    const handleExportCSV = () => exportSalaryStats(activeYear);

    const { rows, count, isLoading } = useGetSalaryStats({
        year: activeYear,
        status,
        page,
        searchText: search || undefined,
    });

    const handleTabChange = (newTab: '1' | '2') => {
        setTab(newTab);
        setPage(1);
    };

    const handleYearChange = (year: string) => {
        setActiveYear(year);
        setPage(1);
    };

    return (
        <Flex vertical gap={24} style={{ padding: '24px 16px 48px', width: '100%' }}>
            {/* Header */}
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Text style={{ fontSize: 24, fontWeight: 600, color: '#101828', lineHeight: '32px' }}>
                    Salary Stats
                </Text>
                <Button
                    type="primary"
                    danger
                    icon={<DownloadOutlined />}
                    loading={isExporting}
                    onClick={handleExportCSV}
                    style={{
                        height: 40,
                        borderRadius: 8,
                        background: '#FF4F4F',
                        borderColor: '#FF4F4F',
                        fontSize: 14,
                    }}
                >
                    Export CSV
                </Button>
            </Flex>

            {/* Tabs + Year + Search row */}
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Flex gap={8} wrap="wrap">
                    <Button
                        onClick={() => handleTabChange('1')}
                        style={{
                            height: 40,
                            borderRadius: 8,
                            background: tab === '1' ? '#FFE5E5' : '#FFFFFF',
                            border: '1px solid #FF4F4F',
                            color: '#FF4F4F',
                            fontSize: 14,
                            fontWeight: 500,
                            padding: '0 20px',
                        }}
                    >
                        Active employees
                    </Button>
                    <Button
                        onClick={() => handleTabChange('2')}
                        style={{
                            height: 40,
                            borderRadius: 8,
                            background: tab === '2' ? '#FFE5E5' : '#FFFFFF',
                            border: '1px solid #FF4F4F',
                            color: '#FF4F4F',
                            fontSize: 14,
                            fontWeight: 500,
                            padding: '0 20px',
                        }}
                    >
                        Past employees
                    </Button>
                </Flex>

                <Flex align="center" gap={8} wrap="wrap" style={{ maxWidth: '100%' }}>
                    {YEARS.map(year => (
                        <Button
                            key={year}
                            onClick={() => handleYearChange(year)}
                            style={{
                                height: 40,
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: activeYear === year ? 600 : 500,
                                background: activeYear === year ? '#FFEDED' : '#FFFFFF',
                                border: '1px solid #FF4F4F',
                                color: '#FF4F4F',
                                padding: '0 20px',
                            }}
                        >
                            {year}
                        </Button>
                    ))}
                    <Input
                        placeholder="Search Employees"
                        prefix={<SearchOutlined style={{ color: '#CBD5E1' }} />}
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, ''));
                            setPage(1);
                        }}
                        allowClear
                        style={{
                            width: 'min(260px, 100%)',
                            height: 40,
                            borderRadius: 8,
                            border: '1px solid #E4E4E7',
                            fontSize: 13,
                        }}
                    />
                </Flex>
            </Flex>

            {/* Table Card */}
            <Flex
                vertical
                style={{
                    background: '#FFFFFF',
                    border: '1px solid #EFF1F4',
                    borderRadius: 20,
                    width: '100%',
                    overflow: 'hidden',
                }}
            >
                <GenericTable
                    rowKey="key"
                    columns={salaryStatsColumns}
                    dataSource={rows}
                    loading={isLoading}
                    pagination={false}
                />
                <Flex justify="flex-end" style={{ padding: '16px 24px' }}>
                    <Pagination
                        current={page}
                        pageSize={10}
                        total={count}
                        showSizeChanger={false}
                        onChange={setPage}
                    />
                </Flex>
            </Flex>
        </Flex>
    );
};

export default SalaryStats;
