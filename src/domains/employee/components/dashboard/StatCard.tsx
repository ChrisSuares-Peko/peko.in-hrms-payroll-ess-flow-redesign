import { Divider, Flex, Typography } from 'antd';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

import { StatBreakdown } from '../../types';

const ON_TIME_COLOR = '#12B76A';
const LATE_COLOR = '#F79009';
const NOT_PRESENT_COLOR = '#E5E7EB';

interface StatCardProps {
    title: string;
    stat: StatBreakdown;
    labels?: [string, string, string];
    onViewMore?: () => void;
}

const StatCard = ({
    title,
    stat,
    labels = ['on time', 'Late attendance', 'not present'],
    onViewMore,
}: StatCardProps) => {
    const chartData = [
        { name: labels[0], value: stat.onTime, color: ON_TIME_COLOR },
        { name: labels[1], value: stat.late, color: LATE_COLOR },
        { name: labels[2], value: stat.notPresent, color: NOT_PRESENT_COLOR },
    ];

    const centerValue = stat.onTime + stat.late;
    const [comparisonHead, ...comparisonRest] = (stat.comparison ?? '').split(' ');

    return (
        <Flex
            vertical
            className="h-full bg-white rounded-[32px] shadow-[0px_1.66px_8.28px_rgba(0,0,0,0.06)]"
        >
            <Flex align="center" justify="space-between" className="px-5 sm:px-9 pt-7 pb-3 gap-2">
                <Typography.Text className="text-xl font-semibold text-[#171717]">
                    {title}
                </Typography.Text>
                <Typography.Link
                    onClick={onViewMore}
                    className="text-base font-medium"
                    style={{ color: '#FF4F4F' }}
                >
                    View more
                </Typography.Link>
            </Flex>
            <Divider className="m-0" />

            <Flex
                align="center"
                justify="space-between"
                wrap="wrap"
                className="flex-1 px-5 sm:px-9 py-4 gap-4"
            >
                <Flex vertical gap={30} className="min-w-[120px]">
                    {chartData
                        .filter(item => item.name)
                        .map(item => (
                            <Flex key={item.name} vertical gap={8}>
                                <span
                                    className="inline-block rounded-full size-[13px]"
                                    style={{ backgroundColor: item.color }}
                                />
                                <Typography.Text className="text-sm text-[#101828]">
                                    <span className="font-bold">{item.value.toLocaleString()}</span>{' '}
                                    {item.name}
                                </Typography.Text>
                            </Flex>
                        ))}
                </Flex>

                <div className="relative" style={{ width: 160, height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                startAngle={90}
                                endAngle={-270}
                                paddingAngle={1}
                                cornerRadius={8}
                                stroke="none"
                            >
                                {chartData.map(item => (
                                    <Cell key={item.name} fill={item.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <Flex
                        vertical
                        align="center"
                        justify="center"
                        gap={0}
                        className="absolute inset-0 pointer-events-none"
                    >
                        <Typography.Text
                            className="text-[29px] font-bold leading-none"
                            style={{ color: '#000000' }}
                        >
                            {centerValue.toLocaleString()}
                        </Typography.Text>
                        <Typography.Text className="text-sm text-[#737373]">
                            /{stat.total.toLocaleString()}
                        </Typography.Text>
                    </Flex>
                </div>
            </Flex>

            {stat.comparison && (
                <Flex className="px-5 pb-5 mt-auto">
                    <Flex
                        align="center"
                        className="w-full px-5 py-3 border border-solid rounded-xl border-[#e6e6e6]"
                    >
                        <Typography.Text className="text-base text-black">
                            <span className="font-semibold">{comparisonHead}</span>{' '}
                            {comparisonRest.join(' ')}
                        </Typography.Text>
                    </Flex>
                </Flex>
            )}
        </Flex>
    );
};

export default StatCard;
