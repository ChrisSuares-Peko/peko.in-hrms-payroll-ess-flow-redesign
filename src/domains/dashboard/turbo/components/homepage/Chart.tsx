import React from 'react';

import { Typography } from 'antd';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const Chart = ({ chartData }: any) => (
    <>
        <Typography.Text className="text-md font-medium -mt-2">
            Fleet Age Distribution
        </Typography.Text>
        <ResponsiveContainer width="100%" height={240}>
            <BarChart
                className="mt-5"
                data={chartData}
                barSize={7} // keep original thin bar size
                margin={{
                    top: 5,
                    right: 10,
                    left: -30,
                    bottom: 5, // keep original bottom margin
                }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, width: 15 }}
                    interval={0} // force show all labels
                />

                <YAxis
                    axisLine={false}
                    style={{ fontSize: '11px' }}
                    domain={[
                        0,
                        (dataMax: number) => {
                            const rounded = Math.ceil(dataMax);
                            // Ensure max is divisible cleanly into 3 steps (for 4 lines: 0, 1/3, 2/3, max)
                            return rounded < 3 ? 3 : rounded;
                        },
                    ]}
                    tickCount={4}
                    allowDecimals={false}
                />

                <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#F79C9C" />
                        <stop offset="100%" stopColor="#F79C9C" />
                    </linearGradient>
                </defs>

                <Bar dataKey="value" minPointSize={1}>
                    {chartData?.map((entry: any, index: any) => (
                        <Cell fill="#FF6D6D" key={index} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </>
);

export default Chart;
