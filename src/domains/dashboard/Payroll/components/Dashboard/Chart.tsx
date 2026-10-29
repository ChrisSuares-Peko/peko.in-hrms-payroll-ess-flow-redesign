import { useCallback, useState } from 'react';

import { Flex, Select, Spin, Typography } from 'antd';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';


import {yearsData} from "@utils/yearData"

import CustomTooltip from './CustomTooltip';
import { useChartDetailsApi } from '../../hooks/dashboardHooks/useChartDetails';

interface ChartInterfaceProps {
    reference?: React.MutableRefObject<null>;
}
const Chart = ({ reference }: ChartInterfaceProps) => {
    const currentDate = new Date();
    const { data, handleYearChange, isLoading } = useChartDetailsApi();

    const currentYear = currentDate.getFullYear().toString();

   
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const handleMouseMove = useCallback((state: any) => {
        if (state.isTooltipActive && state.activeTooltipIndex !== undefined) {
            setActiveIndex(state.activeTooltipIndex);
        } else {
            setActiveIndex(null); // Reset active index when not hovering over a bar
        }
    }, []);
    return (
        <Flex ref={reference} vertical gap={32} className=" border border-solid rounded-2xl">
            <Flex
                align="center"
                justify="space-between"
                className="flex-wrap w-full p-6 border-b border-solid gap-y-5"
            >
                <Flex vertical>
                    <Typography.Text className="text-lg font-medium">
                        Payroll Costs by Month
                    </Typography.Text>
                    {/* <Typography.Text className="text-xs text-gray-500">
                        {`AED ${formatNumberWithLocalString(data?.reduce((acc, curr) => acc + curr.totalSalary, 0) || 0)}`}
                    </Typography.Text> */}
                </Flex>
                <Select
                    size="small"
                    defaultValue={currentYear}
                    className="w-24 rounded-select mr-2"
                    onSelect={handleYearChange}
                    options={yearsData}
                />
            </Flex>
            {isLoading ? (
                <Flex justify="center" align="center" className="py-20 my-16">
                    <Spin size="large" />
                </Flex>
            ) : (
                <ResponsiveContainer className="mt-4" width="100%" height={300}>
                    <BarChart
                        width={500}
                        height={300}
                        data={data}
                        barSize={10}
                        margin={{
                            top: 5,
                            right: 40,
                            left: 0,
                            bottom: 5,
                        }}
                        onMouseMove={handleMouseMove}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, width: 15 }} />
                        <YAxis axisLine={false} style={{ fontSize: '11px' }} />
                        <defs>
                            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor="#F79C9C" />
                                <stop offset="100%" stopColor="#F79C9C" />
                            </linearGradient>
                        </defs>

                        <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />

                        <Bar dataKey="totalSalary">
                            {data?.map((_entry, index) => (
                                <Cell
                                    fill={index === activeIndex ? '#FF6D6D' : 'url(#gradient)'}
                                    key={index}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </Flex>
    );
};

export default Chart;
