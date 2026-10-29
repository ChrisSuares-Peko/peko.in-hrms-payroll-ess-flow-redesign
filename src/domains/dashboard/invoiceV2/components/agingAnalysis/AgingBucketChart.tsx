import React from 'react';

import { Flex, Typography } from 'antd';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { AgingBucket } from '../../hooks/agingAnalysis/useAgingAnalysis';

interface Props {
    data: AgingBucket[];
    height?: number;
}

const fmt = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
    return v.toString();
};

const AgingBucketChart: React.FC<Props> = ({ data, height = 220 }) => (
    <Flex
        vertical
        gap={12}
        className="bg-white rounded-2xl p-5 h-full shadow-[0px_2px_20px_0px_rgba(0,0,0,0.06)]"
    >
        <Typography.Text className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Outstanding by Aging Bucket
        </Typography.Text>
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                barSize={18}
            >
                <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    tickFormatter={fmt}
                />
                <YAxis
                    type="category"
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#4B5563' }}
                    width={90}
                />
                <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #E5E7EB',
                        fontSize: 12,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
                    }}
                    formatter={(v: number) => [
                        `₹${Number(v).toLocaleString('en-IN')}`,
                        'Outstanding',
                    ]}
                />
                <Bar dataKey="value" radius={0}>
                    {data.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </Flex>
);

export default AgingBucketChart;
