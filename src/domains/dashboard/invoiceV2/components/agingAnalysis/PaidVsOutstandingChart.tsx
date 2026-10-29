import React from 'react';

import { Flex, Typography } from 'antd';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import type { PaidVsOutstandingData } from '../../hooks/agingAnalysis/useAgingAnalysis';

interface Props {
    data: PaidVsOutstandingData;
    height?: number;
}

const COLORS = { paid: '#22C55E', outstanding: '#FF3A3A' };

const PaidVsOutstandingChart: React.FC<Props> = ({ data, height = 220 }) => {
    const total = data.paid + data.outstanding;
    const collectedPct = total > 0 ? ((data.paid / total) * 100).toFixed(1) : '0.0';

    const chartData = [
        { name: 'Paid', value: data.paid, color: COLORS.paid },
        { name: 'Outstanding', value: data.outstanding, color: COLORS.outstanding },
    ];

    const fmtAmt = (v: number) =>
        `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <Flex
            vertical
            gap={12}
            className="bg-white rounded-2xl p-5 h-full shadow-[0px_2px_20px_0px_rgba(0,0,0,0.06)]"
        >
            <Typography.Text className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Paid vs Outstanding
            </Typography.Text>
            <Flex vertical align="center" justify="space-between" className="flex-1">
                <ResponsiveContainer width="42%" height={height}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius="52%"
                            outerRadius="78%"
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            strokeWidth={0}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                borderRadius: 8,
                                border: '1px solid #E5E7EB',
                                fontSize: 12,
                                boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
                            }}
                            formatter={(v: number) => [fmtAmt(v), '']}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <Flex vertical gap={10} className="flex-1 px-10 w-full">
                    {chartData.map(item => (
                        <Flex key={item.name} align="center" justify="space-between" gap={8}>
                            <Flex align="center" gap={6} className="flex-shrink-0">
                                <span
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: item.color }}
                                />
                                <Typography.Text className="text-xs text-gray-500">
                                    {item.name}
                                </Typography.Text>
                            </Flex>
                            <Typography.Text className="text-xs font-semibold text-gray-800">
                                {fmtAmt(item.value)}
                            </Typography.Text>
                        </Flex>
                    ))}
                    <Flex align="center" gap={8} className="w-full mt-1">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-green-500"
                                style={{ width: `${collectedPct}%` }}
                            />
                        </div>
                        <Typography.Text className="text-xs text-green-500 flex-shrink-0">
                            {collectedPct}% collected
                        </Typography.Text>
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default PaidVsOutstandingChart;
