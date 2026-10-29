import { Col, Flex, Row, Tag, Typography } from 'antd';

import { workingCapital, WcMetric } from '../../utils/balanceSheetData';
import SectionCard from '../profitLoss/SectionCard';

const { Text } = Typography;

interface CaClBar {
    display: string;
    pct: number;
}

interface WorkingCapitalAnalysisCardProps {
    metrics: WcMetric[];
    currentAssets: CaClBar;
    currentLiabilities: CaClBar;
}

const WorkingCapitalAnalysisCard = ({
    metrics,
    currentAssets,
    currentLiabilities,
}: WorkingCapitalAnalysisCardProps) => (
    <SectionCard title={workingCapital.title} subtitle={workingCapital.subtitle}>
        <Row gutter={[12, 12]} className="w-full">
            {metrics.map((m: WcMetric) => (
                <Col xs={12} key={m.label}>
                    <Flex
                        vertical
                        gap={2}
                        className={`h-full rounded-xl px-4 py-3 ${
                            m.highlight
                                ? 'border border-success-border bg-success-surface'
                                : 'bg-surfaceGray'
                        }`}
                    >
                        <Flex align="center" justify="space-between" gap={6}>
                            <Text className="text-lg font-semibold text-ink">{m.value}</Text>
                            <Tag
                                bordered={false}
                                color={m.tone === 'warning' ? 'warning' : 'success'}
                                className="!m-0 !rounded-full !text-[10px] !font-medium"
                            >
                                {m.status}
                            </Tag>
                        </Flex>
                        <Text className="text-xs text-slate-400">{m.label}</Text>
                    </Flex>
                </Col>
            ))}
        </Row>

        <Flex vertical gap={8} className="w-full">
            <Text className="text-xs font-medium tracking-wide text-slate-400">
                {workingCapital.caVsClLabel}
            </Text>
            <Flex className="h-2.5 w-full overflow-hidden rounded-full">
                <div className="bg-success" style={{ width: `${currentAssets.pct}%` }} />
                <div className="bg-danger" style={{ width: `${currentLiabilities.pct}%` }} />
            </Flex>
            <Flex justify="space-between" gap={8} className="w-full flex-wrap">
                <Text className="text-xs text-success">
                    {`Current Assets ${currentAssets.display}`}
                </Text>
                <Text className="text-xs text-danger">
                    {`Current Liabilities ${currentLiabilities.display}`}
                </Text>
            </Flex>
        </Flex>
    </SectionCard>
);

export default WorkingCapitalAnalysisCard;
