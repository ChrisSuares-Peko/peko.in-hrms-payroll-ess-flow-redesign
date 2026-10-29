import { useState } from 'react';

import { LoadingOutlined, WarningFilled } from '@ant-design/icons';
import { Flex, Select, Spin, Typography } from 'antd';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import PendingReturnsSection from './PendingReturnsSection';
import type { ReturnLiabilityData } from '../../types';
import { FINANCIAL_YEARS } from '../../utils/data';

const fmt = (n: number) =>
    Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface BalanceRow {
    head: string;
    cash: number;
    itc: number;
}
interface ChartRow {
    name: string;
    available: number;
    liability: number;
}
interface FyMonth {
    value: number;
    label: string;
}

interface Props {
    selectedFY: string;
    snapshotMonth: number | undefined;
    selectedMonthLabel: string;
    isLoading: boolean;
    hasShortfall: boolean;
    balanceRows: BalanceRow[];
    balanceTotal: { cash: number; itc: number };
    chartData: ChartRow[];
    fyMonths: FyMonth[];
    liabilityTransactions?: ReturnLiabilityData['transactions'];
    onFYChange: (fy: string) => void;
    onMonthChange: (month: number) => void;
}

const BalanceSnapshotTab = ({
    selectedFY,
    snapshotMonth,
    selectedMonthLabel,
    isLoading,
    hasShortfall,
    balanceRows,
    balanceTotal,
    chartData,
    fyMonths,
    liabilityTransactions,
    onFYChange,
    onMonthChange,
}: Props) => {
    const [activeBar, setActiveBar] = useState<'available' | 'liability' | null>(null);
    return (
        <Flex vertical gap={16}>
            {/* Balance table card */}
            <div className="border border-[#e2e8f0] rounded-[14px] overflow-hidden bg-white">
                <div className="flex flex-wrap gap-3 px-4 sm:px-6 py-5 border-b border-[#eaecf0]">
                    <Flex vertical gap={4} style={{ flex: '1 1 130px', minWidth: 0 }}>
                        <Typography.Text
                            className="text-xs font-medium"
                            style={{ color: '#64748b' }}
                        >
                            Year
                        </Typography.Text>
                        <Select
                            value={selectedFY}
                            options={FINANCIAL_YEARS.map(fy => ({ label: `FY ${fy}`, value: fy }))}
                            style={{ width: '100%' }}
                            getPopupContainer={() => document.body}
                            onChange={onFYChange}
                        />
                    </Flex>
                    <Flex vertical gap={4} style={{ flex: '1 1 130px', minWidth: 0 }}>
                        <Typography.Text
                            className="text-xs font-medium"
                            style={{ color: '#64748b' }}
                        >
                            Month
                        </Typography.Text>
                        <Select
                            placeholder="Select Month"
                            value={snapshotMonth}
                            options={fyMonths}
                            style={{ width: '100%' }}
                            allowClear
                            getPopupContainer={() => document.body}
                            onChange={onMonthChange}
                        />
                    </Flex>
                </div>

                <div
                    className="overflow-x-auto"
                    style={{
                        position: 'relative',
                        opacity: isLoading ? 0.4 : 1,
                        pointerEvents: isLoading ? 'none' : 'auto',
                        transition: 'opacity 0.2s',
                    }}
                >
                    {isLoading && (
                        <Flex
                            justify="center"
                            align="center"
                            style={{ position: 'absolute', inset: 0, zIndex: 10 }}
                        >
                            <Spin
                                indicator={
                                    <LoadingOutlined
                                        style={{ fontSize: 24, color: '#ff4f4f' }}
                                        spin
                                    />
                                }
                            />
                        </Flex>
                    )}
                    <div
                        className="grid bg-[#fafbfb] border-b border-[#eaecf0]"
                        style={{ gridTemplateColumns: '2fr 1.5fr 1.5fr', minWidth: 360 }}
                    >
                        {['Tax Head', 'Cash Ledger Balance', 'ITC Ledger Balance'].map((h, i) => (
                            <div
                                key={i}
                                className="px-4 py-3 text-sm font-semibold whitespace-nowrap"
                                style={{ color: '#42526d' }}
                            >
                                {h}
                            </div>
                        ))}
                    </div>
                    {balanceRows.map(row => (
                        <div
                            key={row.head}
                            className="grid items-center border-b border-[#eaecf0]"
                            style={{
                                gridTemplateColumns: '2fr 1.5fr 1.5fr',
                                minHeight: 52,
                                minWidth: 360,
                            }}
                        >
                            <div className="px-4 py-3">
                                <Typography.Text
                                    className="text-sm font-medium"
                                    style={{ color: '#1e293b' }}
                                >
                                    {row.head}
                                </Typography.Text>
                            </div>
                            <div className="px-4 py-3">
                                <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                                    ₹{fmt(row.cash)}
                                </Typography.Text>
                            </div>
                            <div className="px-4 py-3">
                                <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                                    ₹{fmt(row.itc)}
                                </Typography.Text>
                            </div>
                        </div>
                    ))}
                    <div
                        className="grid items-center bg-[#fafbfb]"
                        style={{
                            gridTemplateColumns: '2fr 1.5fr 1.5fr',
                            minHeight: 52,
                            minWidth: 360,
                        }}
                    >
                        <div className="px-4 py-3">
                            <Typography.Text
                                className="text-sm font-bold"
                                style={{ color: '#1e293b' }}
                            >
                                Total
                            </Typography.Text>
                        </div>
                        <div className="px-4 py-3">
                            <Typography.Text
                                className="text-sm font-bold"
                                style={{ color: '#1e293b' }}
                            >
                                ₹{fmt(balanceTotal.cash)}
                            </Typography.Text>
                        </div>
                        <div className="px-4 py-3">
                            <Typography.Text
                                className="text-sm font-bold"
                                style={{ color: '#1e293b' }}
                            >
                                ₹{fmt(balanceTotal.itc)}
                            </Typography.Text>
                        </div>
                    </div>
                </div>
            </div>

            {/* Liability vs Available Balance chart */}
            <div
                className="border border-[#e2e8f0] rounded-[14px] bg-white px-6 py-5"
                style={{ opacity: isLoading ? 0.4 : 1, transition: 'opacity 0.2s' }}
            >
                <Flex align="flex-start" justify="space-between" className="mb-1">
                    <Flex vertical gap={2}>
                        <Typography.Text
                            className="font-semibold"
                            style={{ fontSize: 16, color: '#1e293b' }}
                        >
                            Liability vs Available Balance
                        </Typography.Text>
                        <Typography.Text className="text-xs" style={{ color: '#64748b' }}>
                            Upcoming GSTR-3B ({selectedMonthLabel}) vs current balance (₹ in
                            thousands)
                        </Typography.Text>
                    </Flex>
                    {hasShortfall && (
                        <Flex align="center" gap={6}>
                            <WarningFilled style={{ color: '#ef4444', fontSize: 14 }} />
                            <Typography.Text
                                className="text-sm font-medium"
                                style={{ color: '#ef4444' }}
                            >
                                Shortfall detected
                            </Typography.Text>
                        </Flex>
                    )}
                </Flex>
                <div style={{ height: 220, marginTop: 16 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barCategoryGap="30%" barGap={4}>
                            <CartesianGrid vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#64748b' }}
                            />
                            <YAxis
                                tickFormatter={v =>
                                    v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`
                                }
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                domain={[0, 'auto']}
                            />
                            <Tooltip
                                cursor={false}
                                isAnimationActive={false}
                                content={({ active, payload, label }) => {
                                    if (!active || !payload?.length || !activeBar) return null;
                                    const item = payload.find(p => p.dataKey === activeBar);
                                    if (!item) return null;
                                    return (
                                        <div
                                            style={{
                                                background: '#fff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 8,
                                                padding: '8px 12px',
                                                fontSize: 13,
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontWeight: 600,
                                                    marginBottom: 4,
                                                    color: '#1e293b',
                                                }}
                                            >
                                                {label}
                                            </div>
                                            <div style={{ color: item.color as string }}>
                                                {activeBar === 'available'
                                                    ? 'Available (Cash+ITC)'
                                                    : 'Liability (est.)'}{' '}
                                                : ₹
                                                {Number(item.value).toLocaleString('en-IN', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                            <Legend
                                align="left"
                                formatter={value => (
                                    <span style={{ fontSize: 12, color: '#475569' }}>
                                        {value === 'available'
                                            ? 'Available (Cash+ITC)'
                                            : 'Liability (est.)'}
                                    </span>
                                )}
                            />
                            <Bar
                                dataKey="available"
                                name="available"
                                fill="#fca5a5"
                                radius={[3, 3, 0, 0]}
                                onMouseEnter={() => setActiveBar('available')}
                                onMouseLeave={() => setActiveBar(null)}
                            />
                            <Bar
                                dataKey="liability"
                                name="liability"
                                fill="#ef4444"
                                radius={[3, 3, 0, 0]}
                                onMouseEnter={() => setActiveBar('liability')}
                                onMouseLeave={() => setActiveBar(null)}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <PendingReturnsSection transactions={liabilityTransactions} />
        </Flex>
    );
};

export default BalanceSnapshotTab;
