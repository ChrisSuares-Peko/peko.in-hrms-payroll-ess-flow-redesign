import React, { useState, useCallback } from 'react';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

import CustomTooltip from './CustomTooltip';
import { CharDataType } from '../types/index';

interface PropsType {
    chartData?: CharDataType[];
}

const Chart = ({ chartData }: PropsType) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const handleMouseMove = useCallback((state: any) => {
        if (state.isTooltipActive && state.activeTooltipIndex !== undefined) {
            setActiveIndex(state.activeTooltipIndex);
        } else {
            setActiveIndex(null); // Reset active index when not hovering over a bar
        }
    }, []);

    return (
        <div className="py-2 mx-2 mb-2 overflow-x-scroll h-80 bg-gray-50 md:bg-white md:py-0">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    data={chartData}
                    barSize={7}
                    margin={{
                        top: 5,
                        right: 40,
                        left: 0,
                        bottom: 12,
                    }}
                    onMouseMove={handleMouseMove}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, width: 15 }} />
                    <YAxis axisLine={false} style={{ fontSize: '11px' }} />
                    <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="#F79C9C" />
                            <stop offset="100%" stopColor="#F79C9C" />
                        </linearGradient>
                    </defs>
                    <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                    <Bar dataKey="amount">
                        {chartData?.map((entry, index) => (
                            <Cell
                                fill={index === activeIndex ? '#FF6D6D' : 'url(#gradient)'}
                                key={index}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default React.memo(Chart);
