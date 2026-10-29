import { useState, useCallback } from 'react';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

import CustomTooltip from './CustomTooltip';
import { RegisterdUserChart } from '../types/types';

// import CustomTooltip from './CustomTooltip';
// import { CorporateData } from '../types/types';

interface PropsType {
    chartData?: RegisterdUserChart;
}

const MonthlyCorporateChart = ({ chartData }: PropsType) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            <LineChart
                width={Math.max(750, (chartData?.length ?? 1) * 50)}
                height={250}
                data={chartData}
                barSize={7}
                margin={{
                    top: 5,
                    right: 40,
                    left: 0,
                    bottom: 5,
                }}
                onMouseMove={handleMouseMove}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="Date" tick={{ fontSize: 10, width: 100 }} />
                <YAxis axisLine={false} style={{ fontSize: '10px' }} />
                <Tooltip
                    cursor={{ fill: 'transparent' }}
                    content={<CustomTooltip labelText="Daily Corporates" />}
                />
                <Line dataKey="count" stroke="#FF4F4F" type="monotone" />
            </LineChart>
        </div>
    );
};

export default MonthlyCorporateChart;
