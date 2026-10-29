import { Col, Flex, Row, Typography } from 'antd';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

import { CapexItem, freeCashFlow } from '../../utils/cashFlowData';
import SectionCard from '../profitLoss/SectionCard';

const { Text } = Typography;

interface FreeCashFlowAnalysisCardProps {
    fcf: { value: string; negative: boolean; note: string };
    capex: { value: string; items: CapexItem[] };
    capexRatio: { value: number; display: string };
}

const FreeCashFlowAnalysisCard = ({ fcf, capex, capexRatio }: FreeCashFlowAnalysisCardProps) => {
    const fill = Math.min(capexRatio.value, 100);
    const gauge = [
        { name: 'fill', value: fill },
        { name: 'rest', value: 100 - fill },
    ];

    return (
        <SectionCard title={freeCashFlow.title}>
            <Row gutter={[16, 16]} className="w-full">
                <Col xs={24} lg={8}>
                    <Flex vertical gap={6} className="h-full rounded-2xl bg-surfaceGray p-5">
                        <Text className="text-xs font-medium tracking-wide text-slate-400">
                            {freeCashFlow.fcf.label}
                        </Text>
                        <Text
                            className={`text-2xl font-semibold ${
                                fcf.negative ? 'text-danger' : 'text-success'
                            }`}
                        >
                            {fcf.value}
                        </Text>
                        <Text className="text-sm text-bodyText">{freeCashFlow.fcf.caption}</Text>
                        <Text className="text-xs text-slate-400">{fcf.note}</Text>
                    </Flex>
                </Col>
                <Col xs={24} lg={8}>
                    <Flex vertical gap={10} className="h-full rounded-2xl bg-surfaceGray p-5">
                        <Text className="text-xs font-medium tracking-wide text-slate-400">
                            {freeCashFlow.capex.label}
                        </Text>
                        <Text className="text-2xl font-semibold text-ink">{capex.value}</Text>
                        <Text className="text-sm text-bodyText">{freeCashFlow.capex.caption}</Text>
                        <Flex vertical gap={8}>
                            {capex.items.map((it: CapexItem) => (
                                <Flex vertical gap={4} key={it.label}>
                                    <Flex justify="space-between" gap={8}>
                                        <Text className="min-w-0 truncate text-xs text-slate-500">
                                            {it.label}
                                        </Text>
                                        <Text className="shrink-0 text-xs">
                                            <span className="text-slate-400">{it.pct}%</span>{' '}
                                            <span className="font-medium text-ink">
                                                {it.display}
                                            </span>
                                        </Text>
                                    </Flex>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-danger"
                                            style={{ width: `${it.pct}%` }}
                                        />
                                    </div>
                                </Flex>
                            ))}
                        </Flex>
                    </Flex>
                </Col>
                <Col xs={24} lg={8}>
                    <Flex vertical gap={6} className="h-full rounded-2xl bg-warning-surface p-5">
                        <Text className="text-xs font-medium tracking-wide text-slate-400">
                            {freeCashFlow.capexRatio.label}
                        </Text>
                        <Text className="text-xl font-semibold text-warning">
                            {capexRatio.display}
                        </Text>
                        <Text className="text-sm text-bodyText">
                            {freeCashFlow.capexRatio.caption}
                        </Text>
                        <div className="relative h-[120px] w-full">
                            <ResponsiveContainer width="100%" height={120}>
                                <PieChart>
                                    <Pie
                                        data={gauge}
                                        dataKey="value"
                                        startAngle={180}
                                        endAngle={0}
                                        cx="50%"
                                        cy="100%"
                                        innerRadius={48}
                                        outerRadius={70}
                                        stroke="none"
                                    >
                                        <Cell fill="#F59E0B" />
                                        <Cell fill="#FCD34D" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <Flex
                                align="center"
                                justify="center"
                                className="pointer-events-none absolute inset-x-0 bottom-1"
                            >
                                <Text className="text-base font-semibold text-warning">
                                    {capexRatio.display}
                                </Text>
                            </Flex>
                        </div>
                        <Flex justify="space-between" className="w-full">
                            <Text className="text-xs text-slate-400">0</Text>
                            <Text className="text-xs text-slate-400">100</Text>
                        </Flex>
                    </Flex>
                </Col>
            </Row>
        </SectionCard>
    );
};

export default FreeCashFlowAnalysisCard;
