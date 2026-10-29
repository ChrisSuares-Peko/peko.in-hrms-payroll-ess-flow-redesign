import { PieChartOutlined } from '@ant-design/icons';
import { Flex } from 'antd';
import { Cell, Pie, PieChart, Tooltip } from 'recharts';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import ChartCard from './ChartCard';
import { faqHint } from '../../faq/FaqHint';
import { DashboardSection } from '../../types/dashboard';
import { CHART_CAPTION, PLACEHOLDER_COLOR, buildJournalHealth } from '../../utils/dashboardCharts';

const SIZE = 160;
const INNER_RADIUS = 52;
const OUTER_RADIUS = 76;

const countText = (value: number) => formatNumberWithLocalString(value, 0, 0);

const JournalHealthCard = ({ section }: { section?: DashboardSection }) => {
    const { segments, total, empty } = buildJournalHealth(section);
    const summary = segments
        .map(segment => `${countText(segment.value)} ${segment.label.toLowerCase()}`)
        .join(', ');

    return (
        <ChartCard
            icon={<PieChartOutlined />}
            title="Journal Health"
            caption={CHART_CAPTION}
            help={faqHint('Dashboard', 'Charts', 'Journal Health')}
        >
            <Flex gap={16} align="center" className="flex-col xl:flex-row">
                <div
                    role="img"
                    aria-label={`Journal health: ${summary}`}
                    className="relative shrink-0"
                    style={{ width: SIZE, height: SIZE }}
                >
                    <PieChart width={SIZE} height={SIZE}>
                        {empty ? (
                            <Pie
                                data={[{ name: 'none', value: 1 }]}
                                dataKey="value"
                                innerRadius={INNER_RADIUS}
                                outerRadius={OUTER_RADIUS}
                                stroke="none"
                                fill={PLACEHOLDER_COLOR}
                                isAnimationActive={false}
                            />
                        ) : (
                            <Pie
                                data={segments}
                                dataKey="value"
                                nameKey="label"
                                innerRadius={INNER_RADIUS}
                                outerRadius={OUTER_RADIUS}
                                startAngle={90}
                                endAngle={-270}
                                minAngle={4}
                                paddingAngle={0}
                                stroke="#ffffff"
                                strokeWidth={2}
                                isAnimationActive={false}
                            >
                                {segments.map(segment => (
                                    <Cell key={segment.key} fill={segment.color} />
                                ))}
                            </Pie>
                        )}
                        {!empty && (
                            <Tooltip
                                formatter={(value, name) => [
                                    countText(Number(value)),
                                    String(name),
                                ]}
                            />
                        )}
                    </PieChart>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xl font-semibold text-textHeadings">
                            {countText(total)}
                        </span>
                        <span className="text-[11px] uppercase tracking-wide text-textBody">
                            Entries
                        </span>
                    </div>
                </div>
                <Flex vertical gap={10} className="w-full min-w-0">
                    {segments.map(segment => (
                        <Flex key={segment.key} align="center" gap={8}>
                            <span className="text-sm" style={{ color: segment.color }}>
                                {segment.icon}
                            </span>
                            <span className="text-sm text-textBody">{segment.label}</span>
                            <span className="ml-auto text-sm font-semibold text-textHeadings">
                                {countText(segment.value)}
                            </span>
                        </Flex>
                    ))}
                </Flex>
            </Flex>
        </ChartCard>
    );
};

export default JournalHealthCard;
