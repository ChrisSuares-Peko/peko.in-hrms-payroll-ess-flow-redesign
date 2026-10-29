import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';

import CustomTooltipMonthlyGMVData from './CustomTooltipMonthlyGMVData';
import { MonthlyStatistic } from '../types/types';

interface PropsType {
    chartData?: MonthlyStatistic[];
}

const MonthlyStaticsGMVChart = ({ chartData }: PropsType) => (
    <div className="py-2 mx-2 mb-2 overflow-x-scroll h-80 bg-gray-50 md:bg-white md:py-0">
        <LineChart
            width={Math.max(750, (chartData?.length ?? 1) * 50)}
            height={250}
            data={chartData}
            margin={{
                top: 5,
                right: 40,
                left: 0,
                bottom: 5,
            }}
        >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, width: 100 }} />
            <YAxis axisLine={false} style={{ fontSize: '10px' }} />
            <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltipMonthlyGMVData />} />
            <Line dataKey="revenue" stroke="#FF4F4F" />
        </LineChart>
    </div>
);

export default MonthlyStaticsGMVChart;
