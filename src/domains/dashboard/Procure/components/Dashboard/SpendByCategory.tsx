import React from 'react';

import { Flex, Grid, Skeleton, Typography } from 'antd';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { DashboardSpendCategory } from '../../types';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

const COLORS = ['#ff4d4f', '#4096ff', '#722ed1', '#ffa940', '#52c41a', '#13c2c2', '#fa8c16', '#eb2f96'];

interface Props {
    spendByCategory?: { total: number; categories: DashboardSpendCategory[] };
    isLoading?: boolean;
}

const SpendByCategory: React.FC<Props> = ({ spendByCategory, isLoading }) => {
    const screens = useBreakpoint();
    const isMobile = !screens.sm;
    const categories = spendByCategory?.categories ?? [];
    const total = spendByCategory?.total ?? 0;
    const chartData = categories.map((c, i) => ({
        name:   c.category,
        value:  c.percentage,
        amount: c.amount,
        color:  COLORS[i % COLORS.length],
    }));

    const formatTotal = (n: number) => {
        if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
        if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return String(n);
    };

    const renderContent = () => {
        if (isLoading) return <Skeleton active paragraph={{ rows: 4 }} />;
        if (categories.length === 0) return (
            <Flex align="center" justify="center" style={{ height: 120 }}>
                <Text className="text-sm text-gray-400">No spend data available</Text>
            </Flex>
        );
        return (
            <Flex vertical={isMobile} align={isMobile ? 'center' : 'center'} gap={isMobile ? 16 : 24}>
                <div style={{ position: 'relative', width: 150, height: 150, flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', zIndex: 0 }}>
                        <div style={{ fontSize: 10, color: '#999' }}>Total</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#222' }}>{formatTotal(total)}</div>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" strokeWidth={0}>
                                {chartData.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const d = payload[0].payload;
                                    return (
                                        <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 8, padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                                            <div style={{ fontWeight: 600, fontSize: 12, color: '#222', marginBottom: 2 }}>{d.name}</div>
                                            <div style={{ fontSize: 12, color: '#666' }}>{d.value}% · ₹{formatTotal(d.amount)}</div>
                                        </div>
                                    );
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <Flex vertical gap={14} style={{ flex: 1, minWidth: 0, width: isMobile ? '100%' : undefined }}>
                    {chartData.map((item) => (
                        <Flex key={item.name} align="center" justify="space-between" gap={8} style={{ width: '100%', minWidth: 0 }}>
                            <Flex align="center" gap={6} style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, display: 'inline-block', flexShrink: 0 }} />
                                <Text className="text-xs text-gray-600 truncate" style={{ minWidth: 0 }}>{item.name}</Text>
                            </Flex>
                            <Text className="text-xs font-semibold text-gray-700 shrink-0">{item.value}%</Text>
                        </Flex>
                    ))}
                </Flex>
            </Flex>
        );
    };

    const hasData = !isLoading && categories.length > 0;

    return (
         <div className="rounded-[20px] p-4 bg-white border border-gray-100 h-full">
            <Title level={5} className="!mb-1">Spend by Category</Title>
            {hasData && (
                <Text className="text-sm text-gray-400 block mb-3 mt-1">
                    Hover a segment to inspect category share.
                </Text>
            )}
            <div className={hasData ? 'mt-4' : ''}>{renderContent()}</div>
        </div>
    );
};

export default SpendByCategory;
