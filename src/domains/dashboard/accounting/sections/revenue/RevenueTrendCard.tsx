import { useState } from 'react';

import { Button, Flex } from 'antd';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { TrendPoint } from '../../utils/revenueStatementData';
import ReportCardState from '../profitLoss/ReportCardState';
import SectionCard from '../profitLoss/SectionCard';

const AXIS_COLOR = '#94A3B8';
const GRID_COLOR = '#E2E8F0';

const formatTick = (value: number) => (value === 0 ? '₹0' : `₹${value.toFixed(1)}L`);

interface RevenueTrendData {
    title: string;
    color: string;
    monthly: TrendPoint[];
    quarterly: TrendPoint[];
}

interface RevenueTrendCardProps {
    data: RevenueTrendData;
    loading?: boolean;
}

const RevenueTrendCard = ({ data, loading }: RevenueTrendCardProps) => {
    const [mode, setMode] = useState<'monthly' | 'quarterly'>('monthly');
    const points = mode === 'quarterly' ? data.quarterly : data.monthly;

    if (loading || (data.monthly.length === 0 && data.quarterly.length === 0)) {
        return (
            <SectionCard title={data.title}>
                <ReportCardState loading={loading} />
            </SectionCard>
        );
    }

    const toggle = (
        <Flex align="center" gap={8} className="shrink-0">
            {(['monthly', 'quarterly'] as const).map(key => {
                const isActive = mode === key;
                return (
                    <Button
                        key={key}
                        type={isActive ? 'primary' : 'default'}
                        danger={isActive}
                        onClick={() => setMode(key)}
                        className={isActive ? '!font-medium' : '!font-medium !text-bodyText'}
                    >
                        {key === 'monthly' ? 'Monthly' : 'Quarterly'}
                    </Button>
                );
            })}
        </Flex>
    );

    return (
        <SectionCard title={data.title} action={toggle}>
            <div className="w-full">
                <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                        <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeDasharray="4 4" />
                        <XAxis
                            dataKey="period"
                            axisLine={false}
                            tickLine={false}
                            dy={6}
                            tick={{ fontSize: 11, fill: AXIS_COLOR }}
                        />
                        <YAxis
                            domain={[0, 'auto']}
                            axisLine={false}
                            tickLine={false}
                            width={46}
                            tickFormatter={formatTick}
                            tick={{ fontSize: 11, fill: AXIS_COLOR }}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={data.color}
                            strokeWidth={2.5}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </SectionCard>
    );
};

export default RevenueTrendCard;
